#!/bin/bash
# ===========================================
# PLUTUS PREDICT - DEPLOYMENT SCRIPT
# ===========================================
# Run after uploading app files
# Usage: chmod +x deploy.sh && ./deploy.sh

APP_DIR="/var/www/plutuspredict"
DOMAIN="yourdomain.com"  # CHANGE THIS TO YOUR DOMAIN

echo "=========================================="
echo "DEPLOYING PLUTUS PREDICT"
echo "=========================================="

cd $APP_DIR

# ==========================================
# BACKEND SETUP
# ==========================================
echo "[1/6] Setting up Backend..."
cd $APP_DIR/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if not exists
if [ ! -f .env ]; then
    echo "Creating backend .env file..."
    cat > .env << 'ENVFILE'
MONGO_URL=mongodb://localhost:27017
DB_NAME=plutuspredict
CORS_ORIGINS=["https://yourdomain.com","http://localhost:3000"]
EMERGENT_LLM_KEY=your_emergent_key_here
STRIPE_API_KEY=your_stripe_key_here
APP_SECRET_KEY=$(openssl rand -hex 32)
RESEND_API_KEY=your_resend_key_here
SENDER_EMAIL=alerts@yourdomain.com
ENVFILE
    echo "⚠️  IMPORTANT: Edit /var/www/plutuspredict/backend/.env with your API keys!"
fi

deactivate

# ==========================================
# FRONTEND SETUP
# ==========================================
echo "[2/6] Setting up Frontend..."
cd $APP_DIR/frontend

# Create .env file
cat > .env << ENVFILE
REACT_APP_BACKEND_URL=https://$DOMAIN
ENVFILE

# Install dependencies and build
yarn install
yarn build

# ==========================================
# PM2 PROCESS SETUP
# ==========================================
echo "[3/6] Setting up PM2 processes..."

# Create PM2 ecosystem file
cat > $APP_DIR/ecosystem.config.js << 'PM2FILE'
module.exports = {
  apps: [
    {
      name: 'plutus-backend',
      cwd: '/var/www/plutuspredict/backend',
      script: 'venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
PM2FILE

# Start backend with PM2
pm2 delete plutus-backend 2>/dev/null
pm2 start $APP_DIR/ecosystem.config.js
pm2 save
pm2 startup

# ==========================================
# NGINX CONFIGURATION
# ==========================================
echo "[4/6] Configuring Nginx..."

cat > /etc/nginx/sites-available/plutuspredict << NGINXCONF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend (React build)
    location / {
        root /var/www/plutuspredict/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        root /var/www/plutuspredict/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXCONF

# Enable site
ln -sf /etc/nginx/sites-available/plutuspredict /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

# ==========================================
# SSL CERTIFICATE (Let's Encrypt)
# ==========================================
echo "[5/6] Setting up SSL..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

# ==========================================
# FIREWALL SETUP
# ==========================================
echo "[6/6] Configuring Firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "=========================================="
echo "DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Your app is now live at: https://$DOMAIN"
echo ""
echo "Admin Panel: https://$DOMAIN/admin"
echo "Demo Login: admin@plutuspredict.com / admin123"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Edit /var/www/plutuspredict/backend/.env with your API keys"
echo "2. Restart backend: pm2 restart plutus-backend"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check process status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart all processes"
echo ""

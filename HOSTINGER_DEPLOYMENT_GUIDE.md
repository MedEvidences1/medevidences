# 🚀 PLUTUS PREDICT - HOSTINGER VPS DEPLOYMENT GUIDE

## Prerequisites
- Hostinger VPS (KVM 1 or KVM 2 recommended)
- Domain name pointed to your VPS IP
- SSH access to your VPS

---

## Step 1: Get Your VPS

1. Go to [Hostinger VPS](https://www.hostinger.com/vps-hosting)
2. Choose **KVM 1** ($5.99/mo) or **KVM 2** ($8.99/mo)
3. Select **Ubuntu 22.04** as the OS
4. Complete purchase and note your:
   - VPS IP Address
   - Root Password

---

## Step 2: Point Your Domain

In Hostinger DNS settings, add:

| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_VPS_IP |
| A | www | YOUR_VPS_IP |

Wait 5-10 minutes for DNS propagation.

---

## Step 3: Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

Enter your root password when prompted.

---

## Step 4: Run Setup Script

Copy and paste this entire block:

```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/YOUR_REPO/hostinger_setup.sh
chmod +x hostinger_setup.sh
./hostinger_setup.sh
```

Or manually run these commands:

```bash
# Update system
apt update && apt upgrade -y

# Install Python 3.11
apt install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install Nginx & tools
apt install -y nginx certbot python3-certbot-nginx
npm install -g pm2 yarn

# Create app directory
mkdir -p /var/www/plutuspredict
```

---

## Step 5: Upload Your App Files

From your local machine (or use FileZilla):

```bash
# Option A: Using SCP
scp -r /path/to/plutuspredict/* root@YOUR_VPS_IP:/var/www/plutuspredict/

# Option B: Using rsync (faster for updates)
rsync -avz --progress /path/to/plutuspredict/ root@YOUR_VPS_IP:/var/www/plutuspredict/
```

Or download from Emergent:
1. Go to your Emergent project
2. Click "Download Code"
3. Extract and upload to VPS

---

## Step 6: Configure Environment Variables

SSH into VPS and edit backend .env:

```bash
nano /var/www/plutuspredict/backend/.env
```

Add your keys:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=plutuspredict
CORS_ORIGINS=["https://yourdomain.com"]
EMERGENT_LLM_KEY=your_key_here
STRIPE_API_KEY=sk_live_your_stripe_key
APP_SECRET_KEY=generate_random_string_here
RESEND_API_KEY=your_resend_key
SENDER_EMAIL=alerts@yourdomain.com
```

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 7: Deploy the Application

```bash
cd /var/www/plutuspredict

# Backend Setup
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Frontend Setup
cd ../frontend
echo "REACT_APP_BACKEND_URL=https://yourdomain.com" > .env
yarn install
yarn build

# Start Backend with PM2
cd ..
pm2 start "cd /var/www/plutuspredict/backend && source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001" --name plutus-backend
pm2 save
pm2 startup
```

---

## Step 8: Configure Nginx

```bash
nano /etc/nginx/sites-available/plutuspredict
```

Paste this (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/plutuspredict/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

Enable and test:

```bash
ln -sf /etc/nginx/sites-available/plutuspredict /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## Step 9: Add SSL Certificate

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to complete SSL setup.

---

## Step 10: Test Your Deployment

Open in browser:
- **Main App**: https://yourdomain.com
- **Admin Panel**: https://yourdomain.com/admin
- **Health Check**: https://yourdomain.com/api/health

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `pm2 status` | Check if backend is running |
| `pm2 logs` | View application logs |
| `pm2 restart plutus-backend` | Restart backend |
| `systemctl status nginx` | Check Nginx status |
| `systemctl status mongod` | Check MongoDB status |
| `certbot renew --dry-run` | Test SSL renewal |

---

## Troubleshooting

### Backend not starting
```bash
cd /var/www/plutuspredict/backend
source venv/bin/activate
python -c "import server"  # Check for import errors
```

### Nginx errors
```bash
nginx -t  # Test configuration
tail -f /var/log/nginx/error.log  # View logs
```

### MongoDB issues
```bash
systemctl status mongod
mongosh  # Test connection
```

---

## URLs Summary

| URL | Purpose |
|-----|---------|
| `https://yourdomain.com` | Main Dashboard |
| `https://yourdomain.com/admin` | Admin Panel |
| `https://yourdomain.com/pricing` | Pricing Page |
| `https://yourdomain.com/chat` | AI Chat |
| `https://yourdomain.com/api/health` | Health Check |

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify MongoDB: `systemctl status mongod`

---

**Your Plutus Predict platform is now live! 🎉**

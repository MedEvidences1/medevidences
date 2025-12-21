#!/bin/bash
# ===========================================
# PLUTUS PREDICT - HOSTINGER VPS SETUP SCRIPT
# ===========================================
# Run this script on your Hostinger VPS
# Usage: chmod +x setup.sh && ./setup.sh

echo "=========================================="
echo "PLUTUS PREDICT - VPS SETUP"
echo "=========================================="

# Update system
echo "[1/8] Updating system..."
apt update && apt upgrade -y

# Install Python 3.11
echo "[2/8] Installing Python 3.11..."
apt install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install Node.js 18
echo "[3/8] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MongoDB
echo "[4/8] Installing MongoDB..."
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install Nginx
echo "[5/8] Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Install PM2 (process manager)
echo "[6/8] Installing PM2..."
npm install -g pm2 yarn

# Create app directory
echo "[7/8] Creating app directory..."
mkdir -p /var/www/plutuspredict
cd /var/www/plutuspredict

# Install Certbot for SSL
echo "[8/8] Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx

echo "=========================================="
echo "BASE SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Upload your app files to /var/www/plutuspredict/"
echo "2. Run the deploy script"
echo ""

# Damascus Master Production Deployment Guide

## Server Requirements
- Node.js 16+ 
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- SSL Certificate (Let's Encrypt)

## Environment Variables
NODE_ENV=production
PORT=3025
JWT_SECRET=your-super-secret-jwt-key-here
# For security, do NOT hardcode credentials in this file. Set environment variables instead.
# Example (.env or process manager):
# ADMIN_EMAIL=your-admin@example.com
# ADMIN_PASSWORD=your-strong-password-here
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENV=live

## Deployment Commands

# 1. Install dependencies
npm install

# 2. Install PM2 globally
npm install -g pm2

# 3. Start application with PM2
pm2 start server/server.js --name "damascus-master"

# 4. Setup PM2 auto-restart
pm2 startup
pm2 save

## Nginx Configuration (/etc/nginx/sites-available/damascusmaster.com)
server {
    listen 80;
    server_name damascusmaster.com www.damascusmaster.com;
    
    location / {
        proxy_pass http://localhost:3025;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

## SSL Setup (Let's Encrypt)
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL Certificate
sudo certbot --nginx -d damascusmaster.com -d www.damascusmaster.com

## Firewall Setup
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

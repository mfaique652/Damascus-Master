# Cloudflare Tunnel Setup Guide

## What is Cloudflare Tunnel?
- Connects your laptop to Cloudflare's network
- No port forwarding needed
- Free SSL certificate included
- DDoS protection
- Works behind any firewall/router

## Setup Steps:

### 1. Install Cloudflared
# Windows (Download from Cloudflare website)
# OR use winget:
winget install cloudflare.cloudflared

### 2. Login to Cloudflare
cloudflared tunnel login

### 3. Create a Tunnel
cloudflared tunnel create damascus-master

### 4. Configure DNS
# Add your domain to Cloudflare
# Point domain to tunnel:
cloudflared tunnel route dns damascus-master damascusmaster.com

### 5. Create Config File
# Create: C:\Users\YourName\.cloudflared\config.yml
tunnel: damascus-master
credentials-file: C:\Users\YourName\.cloudflared\tunnel-id.json

ingress:
  - hostname: damascusmaster.com
    service: http://localhost:3025
  - hostname: www.damascusmaster.com
    service: http://localhost:3025
  - service: http_status:404

### 6. Run Tunnel
cloudflared tunnel run damascus-master

### 7. Auto-start on Windows Boot
# Install as Windows service:
cloudflared service install

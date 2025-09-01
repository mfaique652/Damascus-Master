# Dynamic DNS Setup for Home Hosting

## Popular Dynamic DNS Providers:
- No-IP.com (Free/Paid)
- DuckDNS.org (Free)
- DynDNS.com (Paid)
- FreeDNS.afraid.org (Free)

## Setup Process:

### 1. Sign up for Dynamic DNS
# Example with No-IP:
1. Create account at no-ip.com
2. Create hostname: damascusmaster.no-ip.org
3. Download No-IP DUC (Dynamic Update Client)
4. Install and configure on your laptop

### 2. Router Configuration
Port Forward:
- External Port 80 → Your Laptop IP:3025
- External Port 443 → Your Laptop IP:3025

### 3. Custom Domain (Optional)
If you buy damascusmaster.com:
1. Create CNAME record: @ → damascusmaster.no-ip.org
2. Or redirect domain to your No-IP hostname

### 4. SSL Certificate
# Use Let's Encrypt with domain validation:
certbot certonly --standalone -d damascusmaster.com

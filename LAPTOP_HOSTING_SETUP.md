# Production Server Configuration for Laptop Hosting

# 1. Install PM2 for process management
npm install -g pm2

# 2. Create startup script
# File: start-production.bat
@echo off
cd /d "D:\Users"
pm2 start server/server.js --name "damascus-master"
echo Damascus Master started successfully!
pause

# 3. Auto-start on Windows boot
# Add to Windows startup folder:
# Win + R → shell:startup → Add start-production.bat

# 4. Environment variables for production
# Create .env file:
NODE_ENV=production
PORT=3025
JWT_SECRET=your-super-secret-key-change-this
# Do not store plaintext credentials in this file. Use environment variables or a secure secret store.
# Example .env entries:
# ADMIN_EMAIL=your-admin@example.com
# ADMIN_PASSWORD=your-strong-password-here

# 5. Configure Windows Firewall
# Allow incoming connections on port 3025:
netsh advfirewall firewall add rule name="Damascus Master" dir=in action=allow protocol=TCP localport=3025

# 6. Power settings (keep laptop awake)
powercfg -change -standby-timeout-ac 0
powercfg -change -standby-timeout-dc 0

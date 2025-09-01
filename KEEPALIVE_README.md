# Damascus Master Keep-Alive System

This document explains how the keep-alive system works to prevent your Render server from sleeping.

## 🚀 Built-in Keep-Alive (Already Active)

Your server now includes automatic keep-alive functionality:

- **Self-ping every 13 minutes** to prevent the 15-minute sleep timeout
- **Automatic activation** in production environment
- **Health endpoint**: `https://damascus-master.onrender.com/api/health`
- **Monitoring logs** visible in Render dashboard

## 📊 How It Works

1. **Internal Timer**: Server pings itself every 13 minutes
2. **Health Check**: Uses the `/api/health` endpoint 
3. **Error Handling**: Gracefully handles network failures
4. **Clean Shutdown**: Properly clears intervals on server stop

## 🌐 External Monitoring (Optional but Recommended)

For maximum uptime, set up external monitoring services:

### Option 1: UptimeRobot (Free)
1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Create a free account
3. Add HTTP(s) monitor: `https://damascus-master.onrender.com/api/health`
4. Set interval to 5 minutes
5. Enable notifications

### Option 2: Better Uptime (Free tier)
1. Visit [BetterStack.com](https://betterstack.com/better-uptime)
2. Create account and add heartbeat monitor
3. URL: `https://damascus-master.onrender.com/api/health`
4. Interval: 5 minutes

### Option 3: Use the Included Monitor Script
1. Install Node.js on any external server/VPS
2. Copy `keep-alive-monitor.js` to your server
3. Run: `node keep-alive-monitor.js`
4. Or use PM2: `pm2 start keep-alive-monitor.js --name damascus-keepalive`

## 📈 Monitoring Your Server

### View Keep-Alive Logs
1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Select your Damascus Master service
3. Click "Logs" tab
4. Look for messages like:
   ```
   ✅ Keep-alive ping successful: 200 at 2025-09-02T...
   🚀 Keep-alive enabled: pinging every 13 minutes
   ```

### Verify Health Endpoint
Visit: `https://damascus-master.onrender.com/api/health`

Should return:
```json
{
  "status": "OK",
  "timestamp": "2025-09-02T...",
  "uptime": 1234.567
}
```

## ⚙️ Configuration

### Environment Variables (Optional)
- `ENABLE_KEEPALIVE=true` - Force enable in development
- `RENDER_EXTERNAL_URL` - Override default URL for pinging

### Disable Keep-Alive (if needed)
The keep-alive only runs in production mode. For local development, it's automatically disabled.

## 🔧 Troubleshooting

### Server Still Sleeping?
1. Check Render logs for keep-alive messages
2. Verify health endpoint is responding
3. Add external monitoring as backup
4. Contact Render support if issues persist

### Keep-Alive Not Working?
1. Ensure `NODE_ENV=production` in Render environment
2. Check for error messages in logs
3. Verify the health endpoint is accessible
4. Restart the service from Render dashboard

## 📞 Status Check

Your Damascus Master server should now:
- ✅ Never sleep due to inactivity
- ✅ Self-monitor every 13 minutes  
- ✅ Log ping status for monitoring
- ✅ Handle network failures gracefully
- ✅ Support external monitoring integration

The keep-alive system is now active and will keep your server running 24/7! 🎉

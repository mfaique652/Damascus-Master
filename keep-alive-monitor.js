#!/usr/bin/env node

/**
 * External Keep-Alive Monitor for Damascus Master
 * 
 * This script can be run on any external server, VPS, or even your local machine
 * to ping your Render server and keep it alive 24/7.
 * 
 * Usage:
 * 1. Run locally: node keep-alive-monitor.js
 * 2. Run on VPS with PM2: pm2 start keep-alive-monitor.js --name "damascus-keepalive"
 * 3. Add to cron job: (every 5 minutes) /usr/bin/node /path/to/keep-alive-monitor.js
 */

import fetch from 'node-fetch';

const CONFIG = {
  // Your Render app URL
  SERVER_URL: 'https://damascus-master.onrender.com',
  // Ping interval (5 minutes)
  PING_INTERVAL: 5 * 60 * 1000,
  // Request timeout
  TIMEOUT: 15000,
  // Maximum retries on failure
  MAX_RETRIES: 3
};

class KeepAliveMonitor {
  constructor() {
    this.failureCount = 0;
    this.lastPingTime = null;
    this.totalPings = 0;
    this.successfulPings = 0;
  }

  async ping() {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
      
      const response = await fetch(`${CONFIG.SERVER_URL}/api/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Damascus-Master-External-KeepAlive/1.0',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      this.totalPings++;
      this.lastPingTime = new Date();
      
      if (response.ok) {
        this.successfulPings++;
        this.failureCount = 0;
        console.log(`✅ [${this.lastPingTime.toISOString()}] Ping successful - Status: ${response.status}, Response time: ${responseTime}ms`);
        console.log(`📊 Success rate: ${Math.round((this.successfulPings / this.totalPings) * 100)}% (${this.successfulPings}/${this.totalPings})`);
      } else {
        this.failureCount++;
        console.log(`⚠️ [${this.lastPingTime.toISOString()}] Ping failed - Status: ${response.status}, Response time: ${responseTime}ms`);
      }
      
    } catch (error) {
      this.totalPings++;
      this.failureCount++;
      this.lastPingTime = new Date();
      
      const responseTime = Date.now() - startTime;
      console.log(`❌ [${this.lastPingTime.toISOString()}] Ping error: ${error.message}, Response time: ${responseTime}ms`);
      
      // If too many failures, maybe the server is down
      if (this.failureCount >= CONFIG.MAX_RETRIES) {
        console.log(`🚨 Server appears to be down (${this.failureCount} consecutive failures)`);
        // You could add notification logic here (email, Slack, etc.)
      }
    }
  }

  async start() {
    console.log(`🚀 Starting Damascus Master Keep-Alive Monitor`);
    console.log(`📡 Target: ${CONFIG.SERVER_URL}/api/health`);
    console.log(`⏰ Interval: ${CONFIG.PING_INTERVAL / 1000 / 60} minutes`);
    console.log(`⏱️ Timeout: ${CONFIG.TIMEOUT / 1000} seconds`);
    console.log(`🔄 Max retries: ${CONFIG.MAX_RETRIES}`);
    console.log(`────────────────────────────────────────`);
    
    // Initial ping
    await this.ping();
    
    // Set up interval
    setInterval(() => {
      this.ping();
    }, CONFIG.PING_INTERVAL);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log(`\n🛑 Shutting down keep-alive monitor...`);
      console.log(`📊 Final stats: ${this.successfulPings}/${this.totalPings} successful pings`);
      process.exit(0);
    });
  }

  // Static method for one-time ping (useful for cron jobs)
  static async singlePing() {
    const monitor = new KeepAliveMonitor();
    await monitor.ping();
  }
}

// Check if running as main script
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check for single ping mode (useful for cron)
  if (process.argv.includes('--single') || process.argv.includes('-s')) {
    KeepAliveMonitor.singlePing();
  } else {
    const monitor = new KeepAliveMonitor();
    monitor.start();
  }
}

export default KeepAliveMonitor;

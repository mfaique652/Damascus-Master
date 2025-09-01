# Render Deployment Guide for Damascus Master

## Quick Deployment Steps

### 1. GitHub Repository Setup
```bash
# Make sure your code is in a GitHub repository
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Render Service Creation
1. Visit [https://dashboard.render.com/](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account
4. Select your repository
5. Configure as follows:
   - **Name**: `damascus-master`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Environment Variables Setup

#### Required Variables (Set in Render Dashboard)
```
JWT_SECRET=your-super-secure-jwt-secret-here
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-admin-password
EMAIL_USER=your-smtp-email@gmail.com
EMAIL_PASS=your-app-password
NODE_ENV=production
```

#### Optional Payment Variables
```
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENV=sandbox
STRIPE_SECRET=sk_test_your-stripe-secret
```

### 4. Email Configuration (Gmail Example)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this app password for `EMAIL_PASS`

### 5. PayPal Setup (Optional)
1. Create PayPal Developer account: [https://developer.paypal.com/](https://developer.paypal.com/)
2. Create new application
3. Copy Client ID and Secret
4. Set webhook URL to: `https://your-app-name.onrender.com/api/paypal-webhook`

### 6. Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Your app will be available at: `https://your-app-name.onrender.com`

## Post-Deployment Setup

### 1. Access Admin Panel
1. Visit: `https://your-app-name.onrender.com/admin.html`
2. Login with your admin credentials
3. Configure store settings

### 2. Test Features
- [ ] User registration/login
- [ ] Product browsing
- [ ] Shopping cart
- [ ] Email notifications
- [ ] Payment processing (if configured)
- [ ] Admin functions

### 3. Set Custom Domain (Optional)
1. In Render dashboard, go to Settings
2. Add your custom domain
3. Configure DNS records as instructed

## Monitoring and Maintenance

### Logs
- View logs in Render dashboard under "Logs" tab
- Enable debug mode temporarily: Set `DEBUG=true`

### Database Backup
- Database is stored in persistent disk
- Render automatically handles backups
- For manual backup, access files via Render shell

### Updates
```bash
# Deploy updates
git add .
git commit -m "Update description"
git push origin main
# Render auto-deploys from GitHub
```

## Troubleshooting

### Common Issues

**1. Build Fails**
- Check `package.json` for missing dependencies
- Verify Node.js version compatibility

**2. App Crashes on Start**
- Check environment variables are set
- Review logs for specific error messages

**3. Email Not Working**
- Verify SMTP credentials
- Check app password is used (not regular password)
- Ensure EMAIL_USER and EMAIL_PASS are set

**4. Payments Not Working**
- Verify PayPal/Stripe credentials
- Check webhook URLs
- Test in sandbox mode first

**5. File Upload Issues**
- Check disk storage configuration
- Verify upload directory permissions

### Environment Variable Checklist
```bash
# Required for basic functionality
✅ JWT_SECRET
✅ ADMIN_EMAIL  
✅ ADMIN_PASSWORD
✅ EMAIL_USER
✅ EMAIL_PASS
✅ NODE_ENV=production

# Required for payments
⚠️ PAYPAL_CLIENT_ID (if using PayPal)
⚠️ PAYPAL_CLIENT_SECRET (if using PayPal)
⚠️ STRIPE_SECRET (if using Stripe)
```

## Free Tier Limitations
- 512MB RAM
- Shared CPU
- 1GB persistent disk
- Custom domains available
- Automatic SSL certificates

For higher traffic, upgrade to paid plan.

---

**Need Help?** Check Render documentation or contact support through the dashboard.

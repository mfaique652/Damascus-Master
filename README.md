# Damascus Master E-commerce Website

A modern e-commerce platform for Damascus steel knives and tools.

## 🚀 Deployment on Render

### Prerequisites
- GitHub account
- Render account (free tier available)
- Email account with SMTP access
- PayPal developer account (for payments)

### Step-by-Step Deployment

#### 1. Prepare Your Repository
1. Push your code to GitHub
2. Ensure all sensitive data is removed from the repository
3. The `.gitignore` file will prevent sensitive files from being committed

#### 2. Render Setup
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` configuration

#### 3. Environment Variables (REQUIRED)
Set these environment variables in Render Dashboard:

**Essential Variables:**
- `JWT_SECRET` - A secure random string (Render can auto-generate)
- `ADMIN_EMAIL` - Your admin email address
- `ADMIN_PASSWORD` - Secure admin password
- `EMAIL_USER` - SMTP email for sending notifications
- `EMAIL_PASS` - SMTP email password/app password
- `NODE_ENV` - Set to `production`
- `PORT` - Render automatically sets this to 10000

**Payment Integration (Optional):**
- `PAYPAL_CLIENT_ID` - PayPal application client ID
- `PAYPAL_CLIENT_SECRET` - PayPal application secret
- `PAYPAL_ENV` - Set to `sandbox` for testing, `live` for production
- `PAYPAL_WEBHOOK_ID` - PayPal webhook ID for order notifications

**Stripe Integration (Optional):**
- `STRIPE_SECRET` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret

#### 4. Email Configuration
For Gmail SMTP:
- `EMAIL_USER`: your-email@gmail.com
- `EMAIL_PASS`: Use an App Password (not your regular password)
- Enable 2FA and generate an App Password in Google Account settings

#### 5. PayPal Configuration
1. Create a PayPal Developer account
2. Create a new application
3. Copy the Client ID and Secret
4. Set up webhooks for order notifications

### 🔧 Local Development

#### Installation
```bash
npm install
```

#### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in your environment variables
3. Start the development server:

```bash
npm run dev
```

#### Production Build
```bash
npm start
```

### 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ | Secret key for JWT tokens |
| `ADMIN_EMAIL` | ✅ | Admin email address |
| `ADMIN_PASSWORD` | ✅ | Admin password |
| `EMAIL_USER` | ✅ | SMTP email username |
| `EMAIL_PASS` | ✅ | SMTP email password |
| `PAYPAL_CLIENT_ID` | ⚠️ | PayPal client ID (for payments) |
| `PAYPAL_CLIENT_SECRET` | ⚠️ | PayPal client secret |
| `PAYPAL_ENV` | ❌ | PayPal environment (sandbox/live) |
| `STRIPE_SECRET` | ❌ | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook secret |
| `PORT` | ❌ | Server port (auto-set by Render) |
| `NODE_ENV` | ❌ | Environment (development/production) |
| `DEBUG` | ❌ | Enable debug logging |

### 🗂️ Project Structure

```
├── server/              # Backend Node.js server
│   ├── server.js       # Main server file
│   ├── db.js           # Database configuration
│   └── data/           # Database storage (auto-created)
├── css/                # Stylesheets
├── scripts/            # Frontend JavaScript
├── uploads/            # User uploaded files
├── *.html              # Frontend pages
├── package.json        # Dependencies
├── render.yaml         # Render deployment config
└── .env.example        # Environment variables template
```

### 🔒 Security Features

- JWT-based authentication
- bcrypt password hashing
- CORS protection
- Rate limiting
- Input validation with Zod
- Profanity filtering
- SQL injection prevention

### 🚚 Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Configure all required environment variables
- [ ] Set up email SMTP credentials
- [ ] Configure payment gateways (PayPal/Stripe)
- [ ] Test payment flows in sandbox mode
- [ ] Set up domain and SSL (Render provides free SSL)
- [ ] Configure admin account
- [ ] Test email notifications
- [ ] Verify database persistence
- [ ] Check all forms and user flows

### 🛠️ Troubleshooting

**Common Issues:**

1. **Server won't start**: Check environment variables are set correctly
2. **Email not sending**: Verify SMTP credentials and app passwords
3. **Payments failing**: Check PayPal/Stripe configuration and webhook URLs
4. **Database issues**: Ensure persistent storage is configured in Render
5. **CORS errors**: Verify domain configuration

**Logs:**
- Check Render logs in the dashboard
- Enable debug mode with `DEBUG=true` for verbose logging

### 📞 Support

For deployment issues, check:
1. Render logs in the dashboard
2. Environment variables configuration
3. GitHub repository permissions
4. SMTP and payment gateway credentials

---

**Note**: This application uses file-based storage (lowdb). For high-traffic production use, consider migrating to a proper database like PostgreSQL.

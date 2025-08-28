# Vercel Deployment Guide for WSDMailer

This guide will help you deploy your EmailIt dashboard to Vercel with automatic domain syncing every 12 hours.

## 🚀 Quick Deployment Steps

### 1. **Connect GitHub Repository to Vercel**

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository: `GidyMane/Emailit_Tracker`
4. Vercel will auto-detect it's a Next.js project

### 2. **Configure Environment Variables**

In Vercel Dashboard → Project Settings → Environment Variables, add:

```bash
# Database (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# Kinde Authentication (Required)
KINDE_CLIENT_ID=your_kinde_client_id
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=https://your-app.kinde.com
KINDE_SITE_URL=https://your-app.vercel.app
KINDE_POST_LOGOUT_REDIRECT_URL=https://your-app.vercel.app
KINDE_POST_LOGIN_REDIRECT_URL=https://your-app.vercel.app/dashboard

# EmailIt API (Required)
EMAILIT_API_KEY=your_emailit_api_key

# Cron Security (Required)
CRON_SECRET=your_secure_random_string_here

# Auto-set by Vercel (No action needed)
NEXTAUTH_URL=https://your-app.vercel.app
VERCEL_URL=your-app.vercel.app
```

### 3. **Deploy**

1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Your app will be live at `https://your-app.vercel.app`

## 🔧 Post-Deployment Configuration

### Update Kinde URLs
After deployment, update your Kinde app settings:
- **Allowed callback URLs**: `https://your-app.vercel.app/api/auth/kinde_callback`
- **Allowed logout redirect URLs**: `https://your-app.vercel.app`

### Verify Cron Jobs
1. Go to Vercel Dashboard → Functions → Cron
2. You should see: `/api/cron/sync-domains` scheduled for `0 */12 * * *`
3. Test manually: `https://your-app.vercel.app/api/cron/sync-domains`

## 📊 Cron Job Features

✅ **Automatic Domain Sync**: Runs every 12 hours  
✅ **Error Handling**: Comprehensive logging  
✅ **Admin Dashboard**: Manage via UI  
✅ **Manual Testing**: Test sync anytime  

### Cron Schedule
- **Frequency**: Every 12 hours (00:00 and 12:00 UTC)
- **Endpoint**: `/api/cron/sync-domains`
- **Authentication**: Secured with `CRON_SECRET`

## 🛠️ Build Configuration

Your project is already configured with:

```json
{
  "scripts": {
    "build": "npx prisma generate && next build"
  }
}
```

This ensures Prisma client is generated before building.

## 🔍 Monitoring

### Check Deployment Status
- **Deployments**: Vercel Dashboard → Deployments
- **Function Logs**: Vercel Dashboard → Functions → View Logs
- **Cron Logs**: Check function logs for cron executions

### Admin Dashboard
Access cron management at: `https://your-app.vercel.app/dashboard` (admin only)

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Ensure `DATABASE_URL` is set
   - Check all required environment variables

2. **Cron Not Running**
   - Verify `CRON_SECRET` is set
   - Check Vercel Functions → Cron tab

3. **Database Connection**
   - Ensure database allows connections from Vercel
   - Test connection in preview deployments

4. **Authentication Issues**
   - Update Kinde URLs to match Vercel domain
   - Verify all Kinde environment variables

### Test Endpoints

```bash
# Test domain sync
curl https://your-app.vercel.app/api/emailit/sending-domains

# Test cron endpoint (with auth)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-app.vercel.app/api/cron/sync-domains

# Test dashboard access
curl https://your-app.vercel.app/dashboard
```

## 📈 Performance

### Recommended Vercel Plan
- **Hobby**: Free tier, perfect for testing
- **Pro**: Recommended for production use
- **Enterprise**: For high-volume applications

### Function Limits
- **Execution Time**: 10s (Hobby), 60s (Pro)
- **Memory**: 1024MB max
- **Cron Jobs**: Unlimited on Pro plan

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to:
- **main/master branch**: Production deployment
- **Other branches**: Preview deployments

### Environment Variables per Environment
- **Production**: Set in Vercel Dashboard
- **Preview**: Inherits from Production
- **Development**: Use `.env.local`

## 📝 Next Steps

1. **Deploy to Vercel** ✅
2. **Configure environment variables** ✅
3. **Update Kinde settings** ⏳
4. **Test cron jobs** ⏳
5. **Monitor deployment** ⏳

Your WSDMailer dashboard will automatically sync domains from EmailIt every 12 hours once deployed! 🎉

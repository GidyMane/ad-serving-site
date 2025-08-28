# Vercel Hobby Plan Deployment Guide

## ✅ **Hobby Plan Configuration**

Your project is now configured for Vercel Hobby plan with these adjustments:

### **Cron Job Changes:**
- **Original**: Every 12 hours (`0 */12 * * *`) ❌ Not supported on Hobby
- **Updated**: Daily at 2am (`0 2 * * *`) ✅ Hobby compatible
- **Note**: Timing may vary ±1 hour (1am-3am range)

### **Configuration Files Updated:**
- ✅ `vercel.json` - Daily cron schedule
- ✅ `next.config.ts` - Simplified for Hobby plan
- ✅ Function timeouts optimized

## 🚀 **Deployment Steps**

### **1. Environment Variables (Required)**
Add these in Vercel Dashboard:

```bash
# Core Requirements
DATABASE_URL=your_postgresql_database_url
EMAILIT_API_KEY=your_emailit_api_key
CRON_SECRET=your_secure_random_string

# Kinde Authentication
KINDE_CLIENT_ID=your_kinde_client_id
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=https://your-domain.kinde.com
KINDE_SITE_URL=https://your-app.vercel.app
KINDE_POST_LOGOUT_REDIRECT_URL=https://your-app.vercel.app
KINDE_POST_LOGIN_REDIRECT_URL=https://your-app.vercel.app/dashboard
```

### **2. Deploy to Vercel**
```bash
# Option 1: Via Dashboard
# - Connect GitHub repo
# - Auto-deploy on push

# Option 2: Via CLI
vercel --prod
```

## 📋 **Hobby Plan Features & Limitations**

### ✅ **What Works:**
- ✅ Next.js app deployment
- ✅ Serverless functions
- ✅ Database connections
- ✅ Authentication (Kinde)
- ✅ Daily domain sync (once per day)
- ✅ Admin dashboard
- ✅ Analytics and reporting

### ⚠️ **Hobby Plan Limitations:**
- ❌ **Cron frequency**: Max once per day
- ❌ **Timing precision**: ±1 hour variance
- ❌ **Function timeout**: 10 seconds max
- ❌ **Bandwidth**: 100GB/month limit

## 🔄 **Domain Sync Options**

### **Option 1: Daily Sync (Current)**
- **Schedule**: Once daily at ~2am
- **Cost**: Free
- **Reliability**: Good (with timing variance)

### **Option 2: Manual Sync**
- **Trigger**: Admin dashboard button
- **Cost**: Free
- **Control**: Full control over timing

### **Option 3: External Cron (12-hour sync)**
- **Service**: GitHub Actions (free)
- **Schedule**: Every 12 hours precise
- **Setup**: See below

## 🆓 **Free 12-Hour Sync Alternative**

If you need 12-hour syncing, use GitHub Actions:

**1. Create `.github/workflows/domain-sync.yml`:**
```yaml
name: Domain Sync
on:
  schedule:
    - cron: '0 */12 * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               https://your-app.vercel.app/api/cron/sync-domains
```

**2. Add Secret:**
- Go to GitHub repo → Settings → Secrets
- Add `CRON_SECRET` with your secret value

**3. Remove from vercel.json:**
```json
{
  "comment": "Cron handled by GitHub Actions"
}
```

## 🐛 **Troubleshooting Common Deployment Errors**

### **Error: Build failed**
- ✅ Check all environment variables are set
- ✅ Ensure `DATABASE_URL` is valid
- ✅ Verify Prisma schema is correct

### **Error: Function timeout**
- ✅ Functions have 10s limit on Hobby
- ✅ Optimize slow database queries
- ✅ Use pagination for large datasets

### **Error: Authentication issues**
- ✅ Update Kinde URLs to match Vercel domain
- ✅ Verify all Kinde environment variables
- ✅ Check callback URLs are correct

### **Error: Cron job not working**
- ✅ Hobby allows max 2 cron jobs
- ✅ Schedule must be once daily max
- ✅ Check `CRON_SECRET` is set

## 📊 **Monitoring Your Deployment**

### **Check Health:**
```bash
# Test app
curl https://your-app.vercel.app

# Test domain sync
curl -H "Authorization: Bearer YOUR_SECRET" \
     https://your-app.vercel.app/api/cron/sync-domains

# Test dashboard
curl https://your-app.vercel.app/dashboard
```

### **View Logs:**
- Vercel Dashboard → Functions → View Logs
- Filter by function name
- Monitor cron execution

## 🎯 **Next Steps After Deployment**

1. ✅ Test login at: `https://your-app.vercel.app`
2. ✅ Verify domain sync: Check admin dashboard
3. ✅ Monitor first cron execution
4. ✅ Update Kinde settings with new URLs
5. ✅ Set up monitoring/alerts if needed

Your WSDMailer dashboard will now sync domains daily on Vercel Hobby plan! 🚀

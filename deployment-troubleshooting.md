# Deployment Troubleshooting Guide

## 🚨 **Quick Fixes for Common Deployment Errors**

### **Error 1: Build Failed**
```bash
Error: Build failed with exit code 1
```

**Solution:**
1. Check environment variables are set in Vercel:
   - `DATABASE_URL`
   - `EMAILIT_API_KEY` 
   - All Kinde variables

2. Verify Prisma schema:
```bash
npx prisma validate
npx prisma generate
```

### **Error 2: Function Timeout (Hobby Plan)**
```bash
Error: Function execution timed out after 10 seconds
```

**Solution:**
- Hobby plan has 10-second limit
- Check slow database queries
- Optimize API calls

### **Error 3: Cron Job Configuration Error**
```bash
Error: Invalid cron expression
```

**Solution:**
- Hobby plan only allows daily cron jobs
- Use: `0 2 * * *` (not `0 */12 * * *`)

### **Error 4: Redirect Loop**
If you're being redirected to the landing page repeatedly:

**Check:**
1. Kinde URLs are correct
2. Authentication is working
3. Environment variables are set

## 🔧 **Step-by-Step Fix**

### **1. Clean Up Configuration**
Remove complex configurations that might cause issues:

**Update `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-domains",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### **2. Verify Environment Variables**
Go to Vercel Dashboard → Settings → Environment Variables:

Required variables:
- `DATABASE_URL` ✅
- `EMAILIT_API_KEY` ✅
- `CRON_SECRET` ✅
- `KINDE_CLIENT_ID` ✅
- `KINDE_CLIENT_SECRET` ✅
- `KINDE_ISSUER_URL` ✅
- `KINDE_SITE_URL` ✅
- `KINDE_POST_LOGOUT_REDIRECT_URL` ✅
- `KINDE_POST_LOGIN_REDIRECT_URL` ✅

### **3. Test Locally First**
```bash
npm run dev
# Test that everything works locally
```

### **4. Deploy with Verbose Logs**
```bash
vercel --prod --debug
```

## 🎯 **Minimal Working Configuration**

If you're still having issues, use this minimal setup:

**`vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-domains", 
      "schedule": "0 2 * * *"
    }
  ]
}
```

**`next.config.ts`:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;
```

## 📞 **Get Specific Error Details**

If you're still getting errors, please share:
1. **Error message** from Vercel build logs
2. **Build logs** from Vercel dashboard
3. **Function logs** if functions are failing
4. **Environment variables** you have set (don't share values)

This will help identify the exact issue! 🚀

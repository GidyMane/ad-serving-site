# External Cron Service Setup (Free Alternative)

If you want to keep the 12-hour sync schedule without upgrading to Vercel Pro, you can use external cron services.

## 🆓 **Free External Cron Services**

### **Option 1: Cron-job.org (Recommended)**

1. **Setup:**
   - Go to [cron-job.org](https://cron-job.org)
   - Create free account
   - Add new cron job

2. **Configuration:**
   ```
   URL: https://your-app.vercel.app/api/cron/sync-domains
   Schedule: Every 12 hours (0 */12 * * *)
   Headers: Authorization: Bearer YOUR_CRON_SECRET
   ```

3. **Benefits:**
   - ✅ Free up to 50 jobs
   - ✅ Precise timing
   - ✅ Reliable execution
   - ✅ Email notifications on failures

### **Option 2: GitHub Actions (Free)**

Create `.github/workflows/domain-sync.yml`:

```yaml
name: Domain Sync Cron
on:
  schedule:
    - cron: '0 */12 * * *'  # Every 12 hours
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync-domains:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Domain Sync
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://your-app.vercel.app/api/cron/sync-domains
```

**Setup:**
1. Add `CRON_SECRET` to GitHub repository secrets
2. Commit the workflow file
3. GitHub will run it every 12 hours

### **Option 3: EasyCron (Free Tier)**

1. **Setup:**
   - Go to [easycron.com](https://easycron.com)
   - Free account: 1 cron job
   - Create new cron job

2. **Configuration:**
   ```
   URL: https://your-app.vercel.app/api/cron/sync-domains
   Interval: Every 12 hours
   HTTP Method: GET
   Headers: Authorization=Bearer YOUR_CRON_SECRET
   ```

## 🔧 **Implementation Steps**

### **1. Remove Vercel Cron (if using external)**

Update `vercel.json`:
```json
{
  "comment": "Cron jobs handled externally"
}
```

### **2. Secure Your Endpoint**

Your endpoint is already secured with `CRON_SECRET`. External services will use:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-app.vercel.app/api/cron/sync-domains
```

### **3. Monitor Execution**

- **Logs**: Check Vercel function logs
- **Admin Dashboard**: View sync status in your app
- **Email Alerts**: Configure with external service

## 📊 **Cost Comparison**

| Solution | Cost | Reliability | Timing Precision |
|----------|------|-------------|------------------|
| Vercel Hobby | Free | Limited | ±1 hour |
| Vercel Pro | $20/month | High | Exact |
| External Cron | Free | High | Exact |
| GitHub Actions | Free | High | Exact |

## 🎯 **Recommendation**

For your use case (domain sync every 12 hours):

1. **Development/Testing**: External cron service (free)
2. **Production**: Vercel Pro (if you need other Pro features)
3. **Budget-conscious**: GitHub Actions (free + reliable)

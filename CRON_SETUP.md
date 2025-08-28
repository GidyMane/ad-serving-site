# Domain Sync Cron Job Setup

This document explains how to set up the domain synchronization cron job to run every 12 hours.

## What it does

The cron job calls `/api/emailit/sending-domains` every 12 hours to:
- Fetch domains from EmailIt API
- Sync them with your local database
- Keep domain data up-to-date

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

If you're deploying on Vercel, the cron job is automatically configured via `vercel.json`.

**Requirements:**
- Set `CRON_SECRET` environment variable in Vercel dashboard
- Ensure `EMAILIT_API_KEY` is configured

**Schedule:** Runs every 12 hours (0 */12 * * *)

**Endpoint:** `/api/cron/sync-domains`

### Option 2: QStash (For other platforms)

Use Upstash QStash for serverless cron jobs on any platform.

**Setup:**
1. Get QStash token from [Upstash Console](https://console.upstash.com/)
2. Set environment variables:
   ```bash
   QSTASH_TOKEN=your_qstash_token
   CRON_SECRET=your_secret_key
   APP_URL=https://your-app.com
   ```

3. Setup the cron job via API:
   ```bash
   # Setup cron job
   curl -X POST https://your-app.com/api/setup-cron \
     -H "Content-Type: application/json" \
     -d '{"action": "setup"}'

   # Check status
   curl https://your-app.com/api/setup-cron

   # Remove cron job
   curl -X POST https://your-app.com/api/setup-cron \
     -H "Content-Type: application/json" \
     -d '{"action": "remove"}'
   ```

### Option 3: External Cron Services

Use external services like:
- GitHub Actions
- Cron-job.org
- EasyCron
- Your server's crontab

**Webhook URL:** `https://your-app.com/api/cron/sync-domains`

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
Content-Type: application/json
```

**Schedule:** Every 12 hours

## Environment Variables

Add these to your deployment platform:

```bash
# Required for EmailIt API
EMAILIT_API_KEY=your_emailit_api_key

# Required for cron security
CRON_SECRET=your_secure_random_string

# Required for QStash (if using Option 2)
QSTASH_TOKEN=your_qstash_token

# App URL (auto-detected on Vercel)
APP_URL=https://your-app.com
NEXTAUTH_URL=https://your-app.com
```

## Testing

Test the cron job manually:

```bash
# Test the sync endpoint directly
curl https://your-app.com/api/emailit/sending-domains

# Test the cron endpoint
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-app.com/api/cron/sync-domains
```

## Monitoring

Check the cron job logs:
- Vercel: Function logs in Vercel dashboard
- QStash: Upstash console logs
- External: Service-specific logs

## Troubleshooting

1. **401 Unauthorized**: Check `CRON_SECRET` environment variable
2. **500 Error**: Check `EMAILIT_API_KEY` and network connectivity
3. **Domain sync failed**: Verify EmailIt API is accessible

## Admin Dashboard

Visit `/api/setup-cron` (GET) to see active cron jobs (admin only).

Use the dashboard to:
- View scheduled jobs
- Setup new jobs
- Remove existing jobs

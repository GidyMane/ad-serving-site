import { Client } from '@upstash/qstash';

// QStash client for scheduling cron jobs
const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function setupDomainSyncCron() {
  try {
    // Remove any existing schedule first
    await removeDomainSyncCron().catch(() => {
      // Ignore if no existing schedule
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || process.env.APP_URL;
    
    if (!baseUrl) {
      throw new Error('No base URL configured. Set NEXTAUTH_URL, VERCEL_URL, or APP_URL');
    }

    // Schedule to run every 12 hours
    const cronExpression = '0 */12 * * *'; // Every 12 hours at minute 0
    
    const schedule = await qstash.schedules.create({
      destination: `${baseUrl}/api/cron/sync-domains`,
      cron: cronExpression,
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'default-secret'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'qstash-cron',
        timestamp: new Date().toISOString()
      })
    });

    console.log('Domain sync cron job scheduled successfully:', schedule);
    return schedule;
    
  } catch (error) {
    console.error('Failed to setup domain sync cron:', error);
    throw error;
  }
}

export async function removeDomainSyncCron() {
  try {
    // List all schedules and find domain sync ones
    const schedules = await qstash.schedules.list();
    
    for (const schedule of schedules) {
      if (schedule.destination?.includes('/api/cron/sync-domains')) {
        await qstash.schedules.delete(schedule.scheduleId);
        console.log('Removed existing domain sync schedule:', schedule.scheduleId);
      }
    }
  } catch (error) {
    console.error('Error removing existing cron schedules:', error);
    throw error;
  }
}

export async function listDomainSyncCrons() {
  try {
    const schedules = await qstash.schedules.list();
    return schedules.filter(schedule => 
      schedule.destination?.includes('/api/cron/sync-domains')
    );
  } catch (error) {
    console.error('Error listing cron schedules:', error);
    throw error;
  }
}

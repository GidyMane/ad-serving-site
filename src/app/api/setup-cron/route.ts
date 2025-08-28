import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { setupDomainSyncCron, removeDomainSyncCron, listDomainSyncCrons } from '@/lib/qstash-cron';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmails = ['info@websoftdevelopment.com', 'muragegideon2000@gmail.com'];
    if (!adminEmails.includes(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action } = await request.json();

    switch (action) {
      case 'setup':
        const schedule = await setupDomainSyncCron();
        return NextResponse.json({
          success: true,
          message: 'Domain sync cron job scheduled successfully',
          schedule
        });

      case 'remove':
        await removeDomainSyncCron();
        return NextResponse.json({
          success: true,
          message: 'Domain sync cron jobs removed successfully'
        });

      case 'list':
        const schedules = await listDomainSyncCrons();
        return NextResponse.json({
          success: true,
          schedules
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: setup, remove, or list' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Setup cron error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage cron job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if user is admin
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmails = ['info@websoftdevelopment.com', 'muragegideon2000@gmail.com'];
    if (!adminEmails.includes(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const schedules = await listDomainSyncCrons();
    return NextResponse.json({
      success: true,
      schedules,
      count: schedules.length,
      message: schedules.length > 0 ? 'Active cron jobs found' : 'No active cron jobs'
    });

  } catch (error) {
    console.error('List cron error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list cron jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

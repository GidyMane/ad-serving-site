import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron or authorized source
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // If using Vercel Cron, check for the correct authorization
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting domain sync cron job at:', new Date().toISOString());
    
    // Call the existing sending-domains API
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/emailit/sending-domains`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Include any necessary headers for internal API calls
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Domain sync failed:', errorText);
      return NextResponse.json(
        { 
          error: 'Domain sync failed', 
          details: errorText,
          timestamp: new Date().toISOString()
        }, 
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('Domain sync completed successfully at:', new Date().toISOString());
    
    return NextResponse.json({
      success: true,
      message: 'Domain sync completed successfully',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during domain sync',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// Allow POST for webhook-based triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

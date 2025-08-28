import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  console.log('Starting domain sync at:', new Date().toISOString());

  try {
    // Validate API key
    if (!process.env.EMAILIT_API_KEY) {
      console.error('EMAILIT_API_KEY not configured');
      return NextResponse.json(
        { error: 'EmailIt API key not configured' },
        { status: 500 }
      );
    }

    // Fetch domains from EmailIt API
    console.log('Fetching domains from EmailIt API...');
    const response = await fetch('https://api.emailit.com/v1/sending-domains', {
      headers: {
        Authorization: `Bearer ${process.env.EMAILIT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('EmailIt API error:', response.status, error);
      return NextResponse.json(
        {
          error: `EmailIt API error: ${response.status}`,
          details: error
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`Received ${data.data?.length || 0} domains from EmailIt API`);

    if (!data.data || !Array.isArray(data.data)) {
      console.error('Invalid response format from EmailIt API:', data);
      return NextResponse.json(
        { error: 'Invalid response format from EmailIt API' },
        { status: 500 }
      );
    }

    // Sync domains to database
    let syncedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;

    for (const domain of data.data) {
      if (!domain.name) {
        console.warn('Skipping domain with no name:', domain);
        continue;
      }

      try {
        const result = await prisma.domain.upsert({
          where: { name: domain.name },
          update: {
            updatedAt: new Date(),
          },
          create: {
            name: domain.name,
          },
        });

        // Check if it was an update or create based on the result
        const existingDomain = await prisma.domain.findUnique({
          where: { name: domain.name },
          select: { createdAt: true, updatedAt: true }
        });

        if (existingDomain && existingDomain.createdAt.getTime() === existingDomain.updatedAt.getTime()) {
          createdCount++;
        } else {
          updatedCount++;
        }

        syncedCount++;
      } catch (domainError) {
        console.error(`Error syncing domain ${domain.name}:`, domainError);
        // Continue with other domains even if one fails
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      totalReceived: data.data.length,
      synced: syncedCount,
      created: createdCount,
      updated: updatedCount,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    console.log('Domain sync completed:', summary);

    return NextResponse.json({
      message: 'Domains synced successfully',
      summary
    });

  } catch (err) {
    const duration = Date.now() - startTime;
    console.error('Domain sync error:', err);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: err instanceof Error ? err.message : 'Unknown error',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

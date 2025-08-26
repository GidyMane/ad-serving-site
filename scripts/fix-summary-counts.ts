#!/usr/bin/env npx tsx

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function fixSummaryCounts() {
  console.log('🔍 Checking and fixing EmailSummary counts...');
  
  try {
    // Get all domains
    const domains = await prisma.domain.findMany({
      include: {
        summary: true
      }
    });

    for (const domain of domains) {
      console.log(`\n📧 Processing domain: ${domain.name}`);
      
      // Count actual unique opens and clicks for this domain
      const actualCounts = await prisma.$queryRaw<{
        total_sent: bigint;
        total_loaded: bigint; 
        total_clicked: bigint;
        total_hardfail: bigint;
        total_softfail: bigint;
        total_bounce: bigint;
        total_error: bigint;
        total_held: bigint;
        total_delayed: bigint;
      }[]>`
        SELECT 
          COUNT(CASE WHEN em."deliveryStatus" = 'sent' THEN 1 END) as total_sent,
          COUNT(CASE WHEN em."firstOpenAt" IS NOT NULL THEN 1 END) as total_loaded,
          COUNT(CASE WHEN em."firstClickAt" IS NOT NULL THEN 1 END) as total_clicked,
          COUNT(CASE WHEN em."deliveryStatus" = 'hardfail' THEN 1 END) as total_hardfail,
          COUNT(CASE WHEN em."deliveryStatus" = 'softfail' THEN 1 END) as total_softfail,
          COUNT(CASE WHEN em."deliveryStatus" = 'bounce' THEN 1 END) as total_bounce,
          COUNT(CASE WHEN em."deliveryStatus" = 'error' THEN 1 END) as total_error,
          COUNT(CASE WHEN em."deliveryStatus" = 'held' THEN 1 END) as total_held,
          COUNT(CASE WHEN em."deliveryStatus" = 'delayed' THEN 1 END) as total_delayed
        FROM "Email" em 
        WHERE em."domainId" = ${domain.id}
      `;

      const actual = actualCounts[0];
      const actualNumbers = {
        totalSent: Number(actual.total_sent),
        totalLoaded: Number(actual.total_loaded),
        totalClicked: Number(actual.total_clicked),
        totalHardFail: Number(actual.total_hardfail),
        totalSoftFail: Number(actual.total_softfail),
        totalBounce: Number(actual.total_bounce),
        totalError: Number(actual.total_error),
        totalHeld: Number(actual.total_held),
        totalDelayed: Number(actual.total_delayed),
      };

      console.log('📊 Actual counts from Email table:', actualNumbers);
      
      if (domain.summary) {
        console.log('📊 Current summary counts:', {
          totalSent: domain.summary.totalSent,
          totalLoaded: domain.summary.totalLoaded,
          totalClicked: domain.summary.totalClicked,
          totalHardFail: domain.summary.totalHardFail,
          totalSoftFail: domain.summary.totalSoftFail,
          totalBounce: domain.summary.totalBounce,
          totalError: domain.summary.totalError,
          totalHeld: domain.summary.totalHeld,
          totalDelayed: domain.summary.totalDelayed,
        });

        // Check if counts are different
        const needsUpdate = (
          domain.summary.totalSent !== actualNumbers.totalSent ||
          domain.summary.totalLoaded !== actualNumbers.totalLoaded ||
          domain.summary.totalClicked !== actualNumbers.totalClicked ||
          domain.summary.totalHardFail !== actualNumbers.totalHardFail ||
          domain.summary.totalSoftFail !== actualNumbers.totalSoftFail ||
          domain.summary.totalBounce !== actualNumbers.totalBounce ||
          domain.summary.totalError !== actualNumbers.totalError ||
          domain.summary.totalHeld !== actualNumbers.totalHeld ||
          domain.summary.totalDelayed !== actualNumbers.totalDelayed
        );

        if (needsUpdate) {
          console.log('🔧 Updating summary with correct counts...');
          await prisma.emailSummary.update({
            where: { domainId: domain.id },
            data: actualNumbers
          });
          console.log('✅ Summary updated successfully');
        } else {
          console.log('✅ Summary counts are already correct');
        }
      } else {
        console.log('🔧 Creating new summary with correct counts...');
        await prisma.emailSummary.create({
          data: {
            domainId: domain.id,
            ...actualNumbers
          }
        });
        console.log('✅ Summary created successfully');
      }
    }

    console.log('\n🎉 All domain summaries have been fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing summary counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixSummaryCounts().catch(console.error);

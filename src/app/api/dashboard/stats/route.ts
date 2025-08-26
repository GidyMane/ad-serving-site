import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

interface Domain {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = ["info@websoftdevelopment.com", "muragegideon2000@gmail.com"];
    const isAdmin = adminEmails.includes(user.email);
    let domains: Domain[] = [];

    if (isAdmin) {
      domains = await prisma.domain.findMany();
    } else {
      const userEmailDomain = user.email.split("@")[1];
      if (!userEmailDomain) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }

      const domain = await prisma.domain.findUnique({
        where: { name: userEmailDomain },
      });

      if (!domain) {
        return NextResponse.json(
          { error: "Domain not found", message: "No email data exists for your domain" },
          { status: 404 }
        );
      }

      domains = [domain];
    }

    if (domains.length === 0) {
      return NextResponse.json(
        { error: "No domains found", message: "No email data available" },
        { status: 404 }
      );
    }

    const domainIds = domains.map((d) => d.id);
    const domainFilter = isAdmin
      ? { domainId: { in: domainIds } }
      : { domainId: domains[0].id };

    // Summaries from EmailSummary
    const summaries = await prisma.emailSummary.findMany({
      where: domainFilter,
    });

    const aggregatedSummary = summaries.reduce(
      (acc, s) => ({
        totalSent: acc.totalSent + (s?.totalSent || 0),
        totalHardFail: acc.totalHardFail + (s?.totalHardFail || 0),
        totalSoftFail: acc.totalSoftFail + (s?.totalSoftFail || 0),
        totalBounce: acc.totalBounce + (s?.totalBounce || 0),
        totalError: acc.totalError + (s?.totalError || 0),
        totalHeld: acc.totalHeld + (s?.totalHeld || 0),
        totalDelayed: acc.totalDelayed + (s?.totalDelayed || 0),
        totalLoaded: acc.totalLoaded + (s?.totalLoaded || 0),
        totalClicked: acc.totalClicked + (s?.totalClicked || 0),
      }),
      {
        totalSent: 0,
        totalHardFail: 0,
        totalSoftFail: 0,
        totalBounce: 0,
        totalError: 0,
        totalHeld: 0,
        totalDelayed: 0,
        totalLoaded: 0,
        totalClicked: 0,
      }
    );

    // Delivery metrics
    const totalDelivered = Math.max(
      0,
      aggregatedSummary.totalSent -
        (aggregatedSummary.totalHardFail +
          aggregatedSummary.totalSoftFail +
          aggregatedSummary.totalBounce +
          aggregatedSummary.totalError)
    );

    const totalFailed =
      aggregatedSummary.totalHardFail +
      aggregatedSummary.totalSoftFail +
      aggregatedSummary.totalBounce +
      aggregatedSummary.totalError;

    const deliveryRate =
      aggregatedSummary.totalSent > 0
        ? (totalDelivered / aggregatedSummary.totalSent) * 100
        : 0;

    // Use delivered emails as denominator for more accurate rates (emails that failed can't be opened/clicked)
    const totalDeliveredForRates = Math.max(1, totalDelivered); // Prevent division by zero

    const openRate =
      totalDelivered > 0
        ? (aggregatedSummary.totalLoaded / totalDelivered) * 100
        : 0;

    const clickRate =
      totalDelivered > 0
        ? (aggregatedSummary.totalClicked / totalDelivered) * 100
        : 0;

    // Safe SQL cast to int
    const domainFilterString = isAdmin
      ? `WHERE em."domainId" IN (${domainIds.map((id) => `'${id}'`).join(",")})`
      : `WHERE em."domainId" = '${domains[0].id}'`;

    const recentActivityQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN e."occurredAt" >= NOW() - INTERVAL '7 days' THEN em."id" END)::int as emails_last_7_days,
        COUNT(DISTINCT CASE WHEN e."occurredAt" >= NOW() - INTERVAL '24 hours' THEN em."id" END)::int as emails_last_24_hours,
        COUNT(DISTINCT CASE WHEN e."type" = 'email.loaded' AND e."occurredAt" >= NOW() - INTERVAL '7 days' THEN e."id" END)::int as opens_last_7_days,
        COUNT(DISTINCT CASE WHEN e."type" = 'email.link.clicked' AND e."occurredAt" >= NOW() - INTERVAL '7 days' THEN e."id" END)::int as clicks_last_7_days,
        COUNT(DISTINCT em."to")::int as unique_recipients
      FROM "EmailEvent" e
      JOIN "Email" em ON e."emailId" = em."id"
      ${domainFilterString}
    `;

    const [recentActivity] = await prisma.$queryRawUnsafe<
      {
        emails_last_7_days: number;
        emails_last_24_hours: number;
        opens_last_7_days: number;
        clicks_last_7_days: number;
        unique_recipients: number;
      }[]
    >(recentActivityQuery);

    const engagementQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN e."type" = 'email.loaded' THEN em."to" END)::int as recipients_who_opened,
        COUNT(DISTINCT CASE WHEN e."type" = 'email.link.clicked' THEN em."to" END)::int as recipients_who_clicked,
        COUNT(DISTINCT em."to")::int as total_recipients
      FROM "EmailEvent" e
      JOIN "Email" em ON e."emailId" = em."id"
      ${domainFilterString}
    `;

    const [engagement] = await prisma.$queryRawUnsafe<
      {
        recipients_who_opened: number;
        recipients_who_clicked: number;
        total_recipients: number;
      }[]
    >(engagementQuery);

    // Engagement metrics
    const recipientOpenRate =
      engagement.total_recipients > 0
        ? (engagement.recipients_who_opened / engagement.total_recipients) * 100
        : 0;

    const recipientClickRate =
      engagement.total_recipients > 0
        ? (engagement.recipients_who_clicked / engagement.total_recipients) * 100
        : 0;

    return NextResponse.json({
      stats: {
        totalSent: aggregatedSummary.totalSent,
        delivered: totalDelivered,
        failed: totalFailed,
        opens: aggregatedSummary.totalLoaded,
        clicks: aggregatedSummary.totalClicked,
        pending: aggregatedSummary.totalHeld + aggregatedSummary.totalDelayed,

        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        recipientOpenRate: Math.round(recipientOpenRate * 100) / 100,
        recipientClickRate: Math.round(recipientClickRate * 100) / 100,

        recentActivity: {
          emailsLast7Days: recentActivity?.emails_last_7_days || 0,
          emailsLast24Hours: recentActivity?.emails_last_24_hours || 0,
          opensLast7Days: recentActivity?.opens_last_7_days || 0,
          clicksLast7Days: recentActivity?.clicks_last_7_days || 0,
          uniqueRecipients: recentActivity?.unique_recipients || 0,
        },

        detailedStatus: {
          sent: totalDelivered,
          hardfail: aggregatedSummary.totalHardFail,
          softfail: aggregatedSummary.totalSoftFail,
          bounce: aggregatedSummary.totalBounce,
          error: aggregatedSummary.totalError,
          held: aggregatedSummary.totalHeld,
          delayed: aggregatedSummary.totalDelayed,
        },
      },

      summary: aggregatedSummary,

      engagement: {
        recipientsWhoOpened: engagement?.recipients_who_opened || 0,
        recipientsWhoClicked: engagement?.recipients_who_clicked || 0,
        totalRecipients: engagement?.total_recipients || 0,
        openRate: recipientOpenRate,
        clickRate: recipientClickRate,
      },

      domainName: isAdmin ? "All Domains" : domains[0].name,
      isAdmin,
      domainsCount: isAdmin ? domains.length : 1,
    });
  } catch (error) {
    console.error("Error fetching email statistics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

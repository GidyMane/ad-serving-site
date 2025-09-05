import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

interface Domain {
  id: string;
  name: string;
}

interface EngagementData {
  recipient_email: string;
  total_emails: number | bigint;
  total_opens: number | bigint;
  total_clicks: number | bigint;
  delivered_emails: number | bigint;
  failed_emails: number | bigint;
  last_activity: Date | null;
  first_email_sent: Date | null;
}

function safeJsonResponse<T>(data: T): NextResponse {
  return NextResponse.json(
    JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = ["info@websoftdevelopment.com", "muragegideon2000@gmail.com"];
    const isAdmin = adminEmails.includes(user.email);

    const url = new URL(request.url);
    const selectedDomainId = url.searchParams.get("domainId");

    let domains: Domain[] = [];
    let domainFilter: { domainId?: string | { in: string[] } };

    if (isAdmin) {
      if (selectedDomainId && selectedDomainId !== "all") {
        const d = await prisma.domain.findUnique({ where: { id: selectedDomainId } });
        if (d) {
          domains = [d];
          domainFilter = { domainId: d.id };
        } else {
          domains = await prisma.domain.findMany();
          domainFilter = { domainId: { in: domains.map((d) => d.id) } };
        }
      } else {
        domains = await prisma.domain.findMany();
        domainFilter = { domainId: { in: domains.map((d) => d.id) } };
      }
    } else {
      const userEmailDomain = user.email.split("@")[1];
      if (!userEmailDomain) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }

      const domain = await prisma.domain.findUnique({ where: { name: userEmailDomain } });
      if (!domain) {
        return NextResponse.json(
          { error: "Domain not found", message: "No email data exists for your domain" },
          { status: 404 }
        );
      }

      domains = [domain];
      domainFilter = { domainId: domain.id };
    }

    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const whereClause = {
      ...domainFilter,
      to: { not: null },
      ...(search ? { to: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const recipients = await prisma.email.groupBy({
      by: ["to"],
      where: whereClause,
      _count: { id: true },
      _min: { sentAt: true, createdAt: true },
      _max: { sentAt: true, updatedAt: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
      skip: offset,
    });

    const totalUniqueRecipients = await prisma.email.groupBy({
      by: ["to"],
      where: whereClause,
      _count: { id: true },
    });

    const recipientEmails = recipients.map((r) => r.to).filter(Boolean);
    const domainIds = domains.map((d) => d.id);

    let engagementData: EngagementData[] = [];
    if (recipientEmails.length > 0) {
      if (isAdmin && domains.length > 1) {
        engagementData = (await prisma.$queryRawUnsafe(
          `SELECT
            em."to" as recipient_email,
            COUNT(DISTINCT em."id") as total_emails,
            COUNT(DISTINCT CASE WHEN e."type" = 'email.loaded' THEN em."id" END) as total_opens,
            COUNT(DISTINCT CASE WHEN e."type" = 'email.link.clicked' THEN em."id" END) as total_clicks,
            COUNT(DISTINCT CASE WHEN e."type" = 'email.delivery.sent' THEN em."id" END) as delivered_emails,
            COUNT(DISTINCT CASE WHEN e."type" IN ('email.delivery.hardfail','email.delivery.softfail','email.delivery.bounce','email.delivery.error') THEN em."id" END) as failed_emails,
            MAX(e."occurredAt") as last_activity,
            MIN(em."sentAt") as first_email_sent
          FROM "Email" em
          LEFT JOIN "EmailEvent" e ON e."emailId" = em."id"
          WHERE em."to" = ANY($1)
            AND em."domainId" = ANY($2)
          GROUP BY em."to"`,
          recipientEmails,
          domainIds
        )) as EngagementData[];
      } else {
        engagementData = (await prisma.$queryRawUnsafe(
          `SELECT
            em."to" as recipient_email,
            COUNT(DISTINCT em."id") as total_emails,
            COUNT(DISTINCT CASE WHEN e."type" = 'email.loaded' THEN em."id" END) as total_opens,
            COUNT(DISTINCT CASE WHEN e."type" = 'email.link.clicked' THEN em."id" END) as total_clicks,
            COUNT(DISTINCT CASE WHEN e."type" = 'email.delivery.sent' THEN em."id" END) as delivered_emails,
            COUNT(DISTINCT CASE WHEN e."type" IN ('email.delivery.hardfail','email.delivery.softfail','email.delivery.bounce','email.delivery.error') THEN em."id" END) as failed_emails,
            MAX(e."occurredAt") as last_activity,
            MIN(em."sentAt") as first_email_sent
          FROM "Email" em
          LEFT JOIN "EmailEvent" e ON e."emailId" = em."id"
          WHERE em."to" = ANY($1)
            AND em."domainId" = $2
          GROUP BY em."to"`,
          recipientEmails,
          domains[0].id
        )) as EngagementData[];
      }
    }

    const formattedRecipients = recipients.map((recipient) => {
      const engagement = engagementData.find((e: EngagementData) => e.recipient_email === recipient.to);

      const totalEmails = Number(engagement?.total_emails || Number(recipient._count.id) || 0);
      const totalOpens = Number(engagement?.total_opens || 0);
      const totalClicks = Number(engagement?.total_clicks || 0);
      const deliveredEmails = Number(engagement?.delivered_emails || 0);
      const failedEmails = Number(engagement?.failed_emails || 0);

      return {
        email: recipient.to,
        emailDomain: recipient.to?.split("@")[1] || "unknown",
        totalEmails: totalEmails,
        deliveredEmails: deliveredEmails,
        failedEmails: failedEmails,
        totalOpens: totalOpens,
        totalClicks: totalClicks,
        openRate: totalEmails > 0 ? Math.round((totalOpens / totalEmails) * 100) : 0,
        clickRate: totalEmails > 0 ? Math.round((totalClicks / totalEmails) * 100) : 0,
        firstEmailSent: engagement?.first_email_sent || recipient._min.sentAt || recipient._min.createdAt,
        lastActivity: engagement?.last_activity || recipient._max.sentAt || recipient._max.updatedAt,
      };
    });

    const overviewStats = {
      totalRecipients: totalUniqueRecipients.length,
      totalEmailsSent: formattedRecipients.reduce((sum, r) => sum + r.totalEmails, 0),
      totalOpens: formattedRecipients.reduce((sum, r) => sum + r.totalOpens, 0),
      totalClicks: formattedRecipients.reduce((sum, r) => sum + r.totalClicks, 0),
      averageOpenRate:
        formattedRecipients.length > 0
          ? Math.round(
              formattedRecipients.reduce((sum, r) => sum + r.openRate, 0) /
                formattedRecipients.length
            )
          : 0,
      averageClickRate:
        formattedRecipients.length > 0
          ? Math.round(
              formattedRecipients.reduce((sum, r) => sum + r.clickRate, 0) /
                formattedRecipients.length
            )
          : 0,
    };

    return safeJsonResponse({
      recipients: formattedRecipients,
      overview: overviewStats,
      pagination: {
        total: totalUniqueRecipients.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalUniqueRecipients.length / limit),
        hasMore: totalUniqueRecipients.length > offset + limit,
        hasPrevious: page > 1,
      },
      domainName: isAdmin ? (selectedDomainId && selectedDomainId !== "all" && domains[0] ? domains[0].name : "All Domains") : domains[0].name,
      isAdmin,
    });
  } catch (error) {
    console.error("Error fetching audience data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

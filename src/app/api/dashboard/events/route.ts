import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

interface Domain {
  id: string;
  name: string;
}

interface DomainFilter {
  email?: {
    domainId?: string | { in: string[] };
  };
}

// Helper to safely serialize BigInts without using `any`
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

    let domains: Domain[] = [];
    let domainFilter: DomainFilter;

    if (isAdmin) {
      domains = await prisma.domain.findMany();
      domainFilter = { email: { domainId: { in: domains.map((d) => d.id) } } };
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
      domainFilter = { email: { domainId: domain.id } };
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const eventType = url.searchParams.get("eventType");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    if (!startDate && !endDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.gte = thirtyDaysAgo;
    }

    const whereClause = {
      ...domainFilter,
      occurredAt: dateFilter,
      ...(eventType && eventType !== "all" ? { type: eventType } : {}),
    };

    // ✅ fetch paginated events
    const events = await prisma.emailEvent.findMany({
      where: whereClause,
      include: {
        email: { select: { to: true, from: true, subject: true } },
      },
      orderBy: { occurredAt: "desc" },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.emailEvent.count({ where: whereClause });

    // charts (30d)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const domainIds = domains.map((d) => d.id);

    // ✅ aggregate using relations
    const volumeData = isAdmin
      ? await prisma.$queryRawUnsafe(`
        SELECT DATE(e."occurredAt") as date,
               COUNT(*) as total,
               COUNT(CASE WHEN e.status = 'delivered' THEN 1 END) as delivered,
               COUNT(CASE WHEN e.status IN ('failed','bounced') THEN 1 END) as failed,
               COUNT(CASE WHEN e.type = 'email.loaded' THEN 1 END) as opens,
               COUNT(CASE WHEN e.type = 'email.link.clicked' THEN 1 END) as clicks
        FROM "EmailEvent" e
        INNER JOIN "Email" em ON e."emailId" = em.id
        WHERE em."domainId" = ANY($1)
          AND e."occurredAt" >= $2
        GROUP BY DATE(e."occurredAt")
        ORDER BY DATE(e."occurredAt")
      `, domainIds, thirtyDaysAgo)
      : await prisma.$queryRawUnsafe(`
        SELECT DATE(e."occurredAt") as date,
               COUNT(*) as total,
               COUNT(CASE WHEN e.status = 'delivered' THEN 1 END) as delivered,
               COUNT(CASE WHEN e.status IN ('failed','bounced') THEN 1 END) as failed,
               COUNT(CASE WHEN e.type = 'email.loaded' THEN 1 END) as opens,
               COUNT(CASE WHEN e.type = 'email.link.clicked' THEN 1 END) as clicks
        FROM "EmailEvent" e
        INNER JOIN "Email" em ON e."emailId" = em.id
        WHERE em."domainId" = $1
          AND e."occurredAt" >= $2
        GROUP BY DATE(e."occurredAt")
        ORDER BY DATE(e."occurredAt")
      `, domains[0].id, thirtyDaysAgo);

    const engagementData = isAdmin
      ? await prisma.$queryRawUnsafe(`
        SELECT EXTRACT(DOW FROM e."occurredAt") as day_of_week,
               TO_CHAR(e."occurredAt", 'Day') as day_name,
               COUNT(CASE WHEN e.type = 'email.loaded' THEN 1 END) as opens,
               COUNT(CASE WHEN e.type = 'email.link.clicked' THEN 1 END) as clicks
        FROM "EmailEvent" e
        INNER JOIN "Email" em ON e."emailId" = em.id
        WHERE em."domainId" = ANY($1)
          AND e."occurredAt" >= $2
          AND e.type IN ('email.loaded','email.link.clicked')
        GROUP BY EXTRACT(DOW FROM e."occurredAt"), TO_CHAR(e."occurredAt", 'Day')
        ORDER BY EXTRACT(DOW FROM e."occurredAt")
      `, domainIds, thirtyDaysAgo)
      : await prisma.$queryRawUnsafe(`
        SELECT EXTRACT(DOW FROM e."occurredAt") as day_of_week,
               TO_CHAR(e."occurredAt", 'Day') as day_name,
               COUNT(CASE WHEN e.type = 'email.loaded' THEN 1 END) as opens,
               COUNT(CASE WHEN e.type = 'email.link.clicked' THEN 1 END) as clicks
        FROM "EmailEvent" e
        INNER JOIN "Email" em ON e."emailId" = em.id
        WHERE em."domainId" = $1
          AND e."occurredAt" >= $2
          AND e.type IN ('email.loaded','email.link.clicked')
        GROUP BY EXTRACT(DOW FROM e."occurredAt"), TO_CHAR(e."occurredAt", 'Day')
        ORDER BY EXTRACT(DOW FROM e."occurredAt")
      `, domains[0].id, thirtyDaysAgo);

    return safeJsonResponse({
      events: events.map((event) => ({
        id: event.id,
        emailId: event.emailId,
        to: event.email?.to,
        from: event.email?.from,
        subject: event.email?.subject,
        eventType: event.type,
        status: event.status,
        timestamp: event.occurredAt,
        createdAt: event.createdAt,
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit,
      },
      charts: {
        volume: volumeData,
        engagement: engagementData,
      },
      domainName: isAdmin ? "All Domains" : domains[0].name,
      isAdmin,
    });
  } catch (error) {
    console.error("Error fetching email events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

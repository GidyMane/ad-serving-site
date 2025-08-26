import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

interface Domain {
  id: string;
  name: string;
}

// Helper to safely serialize BigInts
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
    let domainFilter: { domainId?: string | { in: string[] } };

    if (isAdmin) {
      domains = await prisma.domain.findMany();
      domainFilter = { domainId: { in: domains.map((d) => d.id) } };
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

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    if (!startDate && !endDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.gte = thirtyDaysAgo;
    }

    // Build search filter
    const searchFilter = search ? {
      OR: [
        { to: { contains: search, mode: 'insensitive' as const } },
        { from: { contains: search, mode: 'insensitive' as const } },
        { subject: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    // Build status filter
    const statusFilter = status !== "all" ? { deliveryStatus: status } : {};

    const whereClause = {
      ...domainFilter,
      sentAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      ...searchFilter,
      ...statusFilter,
    };

    // Fetch emails with their latest event status
    const emails = await prisma.email.findMany({
      where: whereClause,
      include: {
        domain: {
          select: { name: true }
        },
        events: {
          orderBy: { occurredAt: 'desc' },
          take: 1,
          select: {
            type: true,
            status: true,
            occurredAt: true,
            country: true,
            city: true
          }
        }
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.email.count({ where: whereClause });

    // Format the response with user-friendly data
    const formattedEmails = emails.map(email => {
      const latestEvent = email.events[0];
      
      return {
        messageId: email.messageId,
        recipient: email.to || 'Unknown Recipient',
        sender: email.from || 'Unknown Sender',
        subject: email.subject || 'No Subject',
        domainName: email.domain.name,
        deliveryStatus: email.deliveryStatus || latestEvent?.status || 'Unknown',
        sentDate: email.sentAt,
        firstOpenDate: email.firstOpenAt,
        firstClickDate: email.firstClickAt,
        spamScore: email.spamStatus,
        lastEventType: latestEvent?.type,
        lastEventDate: latestEvent?.occurredAt,
        location: latestEvent?.country && latestEvent?.city 
          ? `${latestEvent.city}, ${latestEvent.country}` 
          : latestEvent?.country || 'Unknown'
      };
    });

    return safeJsonResponse({
      messages: formattedEmails,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit,
      },
      domainName: isAdmin ? "All Domains" : domains[0].name,
      isAdmin,
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

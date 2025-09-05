import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

interface Domain {
  id: string;
  name: string;
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

function getStatusLabel(status: string): string {
  const statusMap: { [key: string]: string } = {
    sent: "Sent",
    delivered: "Delivered",
    failed: "Failed",
    bounced: "Bounced",
    held: "Held",
    delayed: "Delayed",
    rejected: "Rejected",
    queued: "Queued",
    unknown: "Unknown",
  };

  return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
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
    const statusParam = url.searchParams.get("status") || "all";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    if (!startDate && !endDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.gte = thirtyDaysAgo;
    }

    const searchFilter = search
      ? {
          OR: [
            { to: { contains: search, mode: "insensitive" as const } },
            { from: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const whereClause = {
      ...domainFilter,
      ...searchFilter,
      ...(Object.keys(dateFilter).length > 0
        ? {
            OR: [
              { sentAt: dateFilter },
              { createdAt: dateFilter },
              { events: { some: { occurredAt: dateFilter } } },
            ],
          }
        : {}),
    };

    const emails = await prisma.email.findMany({
      where: whereClause,
      include: {
        domain: { select: { name: true } },
        events: {
          orderBy: { occurredAt: "desc" },
          select: {
            type: true,
            status: true,
            occurredAt: true,
            userAgent: true,
            ipAddress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let processedEmails = emails.map((email) => {
      const latestEvent = email.events[0];
      const latestDelivery = email.events.find((e) => e.type.startsWith("email.delivery."));

      const typeToStatus: { [key: string]: string } = {
        'email.delivery.sent': 'delivered',
        'email.delivery.hardfail': 'failed',
        'email.delivery.softfail': 'failed',
        'email.delivery.bounce': 'bounced',
        'email.delivery.error': 'failed',
        'email.delivery.held': 'held',
        'email.delivery.delayed': 'delayed',
      };

      const currentStatus = latestDelivery ? (typeToStatus[latestDelivery.type] || 'unknown') : 'unknown';

      const eventCounts = {
        opens: email.events.filter((e) => e.type === 'email.loaded').length,
        clicks: email.events.filter((e) => e.type === 'email.link.clicked').length,
        totalEvents: email.events.length,
      };

      return {
        id: email.id,
        emailId: email.emailId,
        messageId: email.messageId,
        recipient: email.to || 'Unknown Recipient',
        sender: email.from || 'Unknown Sender',
        subject: email.subject || 'No Subject',
        domainName: email.domain.name,
        currentStatus,
        statusLabel: getStatusLabel(currentStatus),
        sentDate: email.sentAt || email.createdAt,
        firstOpenDate: email.firstOpenAt,
        firstClickDate: email.firstClickAt,
        lastEventType: latestEvent?.type,
        lastEventDate: latestEvent?.occurredAt,
        userAgent: latestEvent?.userAgent,
        ipAddress: latestEvent?.ipAddress,
        analytics: eventCounts,
        createdAt: email.createdAt,
      };
    });

    if (statusParam !== 'all') {
      processedEmails = processedEmails.filter((email) => {
        const s = email.currentStatus.toLowerCase();
        if (statusParam === 'delivered' || statusParam === 'sent') return s === 'delivered' || s === 'sent';
        return s === statusParam.toLowerCase();
      });
    }

    const totalCount = processedEmails.length;
    const paginatedEmails = processedEmails.slice(offset, offset + limit);

    return safeJsonResponse({
      messages: paginatedEmails,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: totalCount > offset + limit,
        hasPrevious: page > 1,
      },
      domainName: isAdmin ? (selectedDomainId && selectedDomainId !== "all" && domains[0] ? domains[0].name : "All Domains") : domains[0].name,
      isAdmin,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

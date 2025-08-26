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

// Extract status from event type (e.g., "email.delivery.held" -> "held")
function extractStatusFromEventType(eventType: string): string {
  if (!eventType) return 'unknown';
  
  const parts = eventType.split('.');
  if (parts.length >= 3 && parts[0] === 'email' && parts[1] === 'delivery') {
    return parts[2]; // "held", "sent", "failed", etc.
  }
  
  // Handle other event types
  if (eventType.includes('failed') || eventType.includes('fail')) return 'failed';
  if (eventType.includes('bounce')) return 'bounced';
  if (eventType.includes('sent') || eventType.includes('delivered')) return 'delivered';
  if (eventType.includes('held')) return 'held';
  if (eventType.includes('delayed')) return 'delayed';
  if (eventType.includes('rejected')) return 'rejected';
  
  return eventType.split('.').pop() || 'unknown';
}

// Get user-friendly status label
function getStatusLabel(status: string): string {
  const statusMap: { [key: string]: string } = {
    'sent': 'Sent',
    'delivered': 'Delivered',
    'failed': 'Failed',
    'bounced': 'Bounced',
    'held': 'Held',
    'delayed': 'Delayed',
    'rejected': 'Rejected',
    'queued': 'Queued',
    'unknown': 'Unknown'
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
    const statusParam = url.searchParams.get("status") || "all";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

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

    const whereClause = {
      ...domainFilter,
      sentAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      ...searchFilter,
    };

    // Fetch all emails with their events
    const emails = await prisma.email.findMany({
      where: whereClause,
      include: {
        domain: {
          select: { name: true }
        },
        events: {
          orderBy: { occurredAt: 'desc' },
          select: {
            type: true,
            status: true,
            occurredAt: true,
            country: true,
            city: true,
            userAgent: true,
            ipAddress: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Process emails and extract latest delivery status
    let processedEmails = emails.map(email => {
      // Find the latest delivery event with actual status
      const deliveryEvent = email.events.find(event =>
        event.status && (
          event.type.startsWith('email.delivery.') ||
          event.type.includes('sent') ||
          event.type.includes('delivered') ||
          event.type.includes('failed') ||
          event.type.includes('bounced')
        )
      );

      const latestEvent = email.events[0];
      // Use the actual status from the event, not parsed from type
      const currentStatus = deliveryEvent?.status || latestEvent?.status || 'unknown';

      // Count different event types for analytics
      const eventCounts = {
        opens: email.events.filter(e => e.type === 'email.loaded').length,
        clicks: email.events.filter(e => e.type === 'email.link.clicked').length,
        totalEvents: email.events.length
      };

      return {
        id: email.id,
        emailId: email.emailId,
        messageId: email.messageId,
        recipient: email.to || 'Unknown Recipient',
        sender: email.from || 'Unknown Sender',
        subject: email.subject || 'No Subject',
        domainName: email.domain.name,
        currentStatus: currentStatus,
        statusLabel: getStatusLabel(currentStatus),
        sentDate: email.sentAt || email.createdAt,
        firstOpenDate: email.firstOpenAt,
        firstClickDate: email.firstClickAt,
        lastEventType: latestEvent?.type,
        lastEventDate: latestEvent?.occurredAt,
        userAgent: latestEvent?.userAgent,
        ipAddress: latestEvent?.ipAddress,
        analytics: eventCounts,
        createdAt: email.createdAt
      };
    });

    // Apply status filter after processing
    if (statusParam !== "all") {
      processedEmails = processedEmails.filter(email => 
        email.currentStatus.toLowerCase() === statusParam.toLowerCase()
      );
    }

    // Apply pagination
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
        hasPrevious: page > 1
      },
      domainName: isAdmin ? "All Domains" : domains[0].name,
      isAdmin,
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

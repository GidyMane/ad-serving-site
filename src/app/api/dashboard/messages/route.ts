import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

function safeJsonResponse<T>(data: T): NextResponse {
return NextResponse.json(JSON.parse(JSON.stringify(data, (_, value) =>
typeof value === "bigint" ? value.toString() : value
)));
}

const STATUS_META: Record<string, { label: string; description: string }> = {
'email.delivery.sent': { label: 'Sent', description: 'Email has been sent to the recipient.' },
'email.delivery.hardfail': { label: 'Hard Fail', description: 'Email could not be delivered to the recipient.' },
'email.delivery.softfail': { label: 'Soft Fail', description: 'Email could not be temporarily delivered and will be retried later.' },
'email.delivery.bounce': { label: 'Bounced', description: 'Email could not be delivered.' },
'email.delivery.error': { label: 'Error', description: 'System error has occurred while trying to send this email. Will retry later.' },
'email.delivery.held': { label: 'Held', description: 'Email has been held; your account could be blocked, limited or under review.' },
'email.delivery.delayed': { label: 'Delayed', description: 'Email has been delayed, likely due to your rate limit.' },
'email.loaded': { label: 'Opened', description: 'Email has been loaded.' },
'email.link.clicked': { label: 'Clicked', description: 'Email link has been clicked.' },
};

function getLabelForType(type?: string): string {
if (!type) return 'Unknown';
return STATUS_META[type]?.label || 'Unknown';
}

function getDescriptionForType(type?: string): string {
if (!type) return 'No delivery status recorded yet.';
return STATUS_META[type]?.description || 'No delivery status recorded yet.';
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
const search = url.searchParams.get("search") || "";  
const statusParam = url.searchParams.get("status") || "all";  
const page = parseInt(url.searchParams.get("page") || "1");  
const limit = parseInt(url.searchParams.get("limit") || "20");  
const offset = (page - 1) * limit;  

// Domain filter  
let domainIds: string[] = [];  
let domainName = "All Domains";  

if (isAdmin) {  
  if (selectedDomainId && selectedDomainId !== "all") {  
    const d = await prisma.domain.findUnique({  
      where: { id: selectedDomainId },  
      select: { id: true, name: true }  
    });  
    if (d) {  
      domainIds = [d.id];  
      domainName = d.name;  
    } else {  
      const domains = await prisma.domain.findMany({ select: { id: true } });  
      domainIds = domains.map((d) => d.id);  
    }  
  } else {  
    const domains = await prisma.domain.findMany({ select: { id: true } });  
    domainIds = domains.map((d) => d.id);  
  }  
} else {  
  const userEmailDomain = user.email.split("@")[1];  
  if (!userEmailDomain) {  
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });  
  }  
  const domain = await prisma.domain.findUnique({  
    where: { name: userEmailDomain },  
    select: { id: true, name: true }  
  });  
  if (!domain) {  
    return NextResponse.json({ error: "Domain not found", message: "No email data exists for your domain" }, { status: 404 });  
  }  
  domainIds = [domain.id];  
  domainName = domain.name;  
}  

// Search filter  
const searchFilter = search  
  ? {  
      OR: [  
        { to: { contains: search, mode: "insensitive" as const } },  
        { from: { contains: search, mode: "insensitive" as const } },  
        { subject: { contains: search, mode: "insensitive" as const } },  
      ],  
    }  
  : {};  

// Build WHERE clause without date filter  
// const whereClause: any = {  
//   domainId: { in: domainIds },  
//   ...searchFilter,  
// };  
const whereClause: Prisma.EmailWhereInput = {  
  domainId: { in: domainIds },  
  ...searchFilter,  
};

// Fetch total count and paginated emails  
const [totalCount, emails] = await Promise.all([  
  prisma.email.count({ where: whereClause }),  
  prisma.email.findMany({  
    where: whereClause,  
    select: {  
      id: true,  
      emailId: true,  
      messageId: true,  
      to: true,  
      from: true,  
      subject: true,  
      sentAt: true,  
      createdAt: true,  
      firstOpenAt: true,  
      firstClickAt: true,  
      domainId: true,  
      domain: { select: { name: true } },  
      events: {  
        select: { id: true, type: true, status: true, occurredAt: true, userAgent: true, ipAddress: true },  
      },  
    },  
    orderBy: { createdAt: "desc" },  // newest first  
    skip: offset,  
    take: limit,  
  }),  
]);  

// Process emails for status  
const processedEmails = emails.map((email) => {  
  const events = email.events || [];  
  const latestEvent = events.length > 0 ? events[0] : null;  
  const latestDelivery = events.find((e) => e.type.startsWith("email.delivery."));  

  const eventCounts = {  
    opens: events.filter((e) => e.type === "email.loaded").length,  
    clicks: events.filter((e) => e.type === "email.link.clicked").length,  
    totalEvents: events.length,  
  };  

  let statusType = latestDelivery?.type || latestEvent?.type;  
  if (!statusType && (eventCounts.opens > 0 || eventCounts.clicks > 0)) {  
    statusType = "email.loaded";  
  }  
  if (!statusType && email.sentAt) {  
    statusType = "email.delivery.sent";  
  }  
  if (!statusType) statusType = "unknown";  

  return {  
    id: email.id,  
    emailId: email.emailId,  
    messageId: email.messageId,  
    recipient: email.to || "Unknown Recipient",  
    sender: email.from || "Unknown Sender",  
    subject: email.subject || "No Subject",  
    domainName: email.domain.name,  
    currentStatus: getLabelForType(statusType),  
    statusLabel: getLabelForType(statusType),  
    statusType,  
    statusDescription: getDescriptionForType(statusType),  
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

// Filter by status if specified  
const finalEmails = statusParam !== "all" ? processedEmails.filter((e) => e.statusType === statusParam) : processedEmails;  

return safeJsonResponse({  
  messages: finalEmails,  
  pagination: {  
    total: totalCount,  
    page,  
    limit,  
    totalPages: Math.ceil(totalCount / limit),  
    hasMore: totalCount > offset + limit,  
    hasPrevious: page > 1,  
  },  
  domainName,  
  isAdmin,  
});  

} catch (error) {
console.error("Error fetching messages:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
}

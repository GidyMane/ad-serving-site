import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

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

    if (isAdmin) {
      const domains = await prisma.domain.findMany({
        include: {
          summary: true,
          _count: { select: { emails: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (selectedDomainId && selectedDomainId !== "all") {
        const selected = domains.find((d) => d.id === selectedDomainId);
        if (selected) {
          return NextResponse.json({
            domain: {
              id: selected.id,
              name: selected.name,
              emailCount: selected._count.emails,
              summary: selected.summary,
              createdAt: selected.createdAt,
              updatedAt: selected.updatedAt,
            },
            userEmail: user.email,
            userDomain: selected.name,
            isAdmin: true,
            allDomains: domains.map((d) => ({
              id: d.id,
              name: d.name,
              emailCount: d._count.emails,
              summary: d.summary,
            })),
          });
        }
      }

      const aggregated = domains.reduce(
        (acc, d) => {
          acc.emailCount += d._count.emails || 0;
          acc.summary.totalSent += d.summary?.totalSent || 0;
          acc.summary.totalHardFail += d.summary?.totalHardFail || 0;
          acc.summary.totalSoftFail += d.summary?.totalSoftFail || 0;
          acc.summary.totalBounce += d.summary?.totalBounce || 0;
          acc.summary.totalError += d.summary?.totalError || 0;
          acc.summary.totalHeld += d.summary?.totalHeld || 0;
          acc.summary.totalDelayed += d.summary?.totalDelayed || 0;
          acc.summary.totalLoaded += d.summary?.totalLoaded || 0;
          acc.summary.totalClicked += d.summary?.totalClicked || 0;
          return acc;
        },
        {
          emailCount: 0,
          summary: {
            totalSent: 0,
            totalHardFail: 0,
            totalSoftFail: 0,
            totalBounce: 0,
            totalError: 0,
            totalHeld: 0,
            totalDelayed: 0,
            totalLoaded: 0,
            totalClicked: 0,
          },
        }
      );

      return NextResponse.json({
        domain: {
          id: "admin-all",
          name: "All Domains",
          emailCount: aggregated.emailCount,
          summary: aggregated.summary,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        userEmail: user.email,
        userDomain: "All Domains",
        isAdmin: true,
        allDomains: domains.map((d) => ({
          id: d.id,
          name: d.name,
          emailCount: d._count.emails,
          summary: d.summary,
        })),
      });
    }

    const userEmailDomain = user.email.split("@")[1];
    if (!userEmailDomain) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const domain = await prisma.domain.findUnique({
      where: { name: userEmailDomain },
      include: {
        summary: true,
        _count: { select: { emails: true } },
      },
    });

    if (!domain) {
      return NextResponse.json(
        {
          error: "No domain data found",
          userDomain: userEmailDomain,
          message: "No email data exists for your domain",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      domain: {
        id: domain.id,
        name: domain.name,
        emailCount: domain._count.emails,
        summary: domain.summary,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
      },
      userEmail: user.email,
      userDomain: userEmailDomain,
      isAdmin: false,
    });
  } catch (error) {
    console.error("Error fetching domain data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

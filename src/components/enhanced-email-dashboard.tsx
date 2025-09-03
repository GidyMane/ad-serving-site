"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { BarChart3, Bell, ChevronDown, FileText, Home, Inbox, Mail, MailOpen, Search, Send, Settings, TrendingUp, TrendingDown, Users, Zap, UserCheck, XCircle, CheckCircle, Clock, Eye, MousePointer } from 'lucide-react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { Skeleton, CardSkeleton, ChartSkeleton, TableSkeleton, ProgressSkeleton } from "@/components/ui/skeleton"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs"

const getNavigation = (isAdmin: boolean = false) => [
  {
    title: "Main Navigation",
    items: [
      { title: "Dashboard", tab: "overview", icon: Home, isActive: true },
      { title: "Campaigns", icon: Mail, url: "#" },
      { title: "Templates", icon: FileText, url: "#" },
      { title: "Audience", tab: "audience", icon: Users },
      { title: "Analytics", tab: "analytics", icon: BarChart3 },
      ...(isAdmin ? [{ title: "Sending Domains", tab: "domains", icon: Send }] : []),
    ]
  },
]

interface DomainData {
  domain: {
    id: string;
    name: string;
    emailCount: number;
    summary: EmailSummary | null;
    createdAt: string;
    updatedAt: string;
  };
  userEmail: string;
  userDomain: string;
}

interface EmailSummary {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpens: number;
  totalClicks: number;
}

interface EmailStats {
  totalSent: number;
  delivered: number;
  failed: number;
  opens: number;
  clicks: number;
  pending: number;
  deliveryRate: number;
  detailedStatus?: {
    sent: number;
    hardfail: number;
    softfail: number;
    bounce: number;
    error: number;
    held: number;
    delayed: number;
  };
}

interface DomainDistribution {
  recipient_domain: string;
  unique_recipients: number;
  total_emails: number;
}

interface AudienceOverview {
  totalRecipients: number;
  activeRecipients: number;
  inactiveRecipients: number;
  bouncedRecipients: number;
}

interface Recipient {
  email: string;
  recipient_domain: string;
  total_emails: number;
  last_seen: string;
  status: string;
}

interface AudienceData {
  audience: Recipient[];
  domainDistribution: DomainDistribution[];
  overview: AudienceOverview;
  engagement: {
    openRate: number;
    clickRate: number;
  };
  domainName: string;
  isAdmin: boolean;
}

interface VolumeData {
  date: string;
  total: number;
  delivered: number;
  failed: number;
  opens: number;
  clicks: number;
}

interface EngagementChartData {
  day_name: string;
  opens: number;
  clicks: number;
}

interface ChartData {
  volume: VolumeData[];
  engagement: EngagementChartData[];
}

interface EmailEventData {
  id: string;
  emailId: number;
  messageId: string;
  to: string;
  from: string;
  subject: string;
  eventType: string;
  status: string;
  timestamp: string;
  createdAt: string;
}

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface EventsData {
  events: EmailEventData[];
  pagination: PaginationData;
  charts: ChartData;
  domainName: string;
}

interface DomainSummary {
  totalSent: number;
  totalHardFail: number;
  totalSoftFail: number;
  totalBounce: number;
  totalError: number;
  totalHeld: number;
  totalDelayed: number;
  totalLoaded: number;
  totalClicked: number;
}

interface SendingDomain {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  totalEmails: number;
  uniqueRecipients: number;
  lastEmailSent: string | null;
  summary: DomainSummary | null;
}

interface DomainsData {
  domains: SendingDomain[];
  totalDomains: number;
  isAdmin: boolean;
}

export function EnhancedEmailDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [domainData, setDomainData] = useState<DomainData | null>(null)
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null)
  const [audienceData, setAudienceData] = useState<AudienceData | null>(null)
  const [eventsData, setEventsData] = useState<EventsData | null>(null)
  const [domainsData, setDomainsData] = useState<DomainsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch domain data first
        const domainResponse = await fetch('/api/dashboard/domain')
        if (!domainResponse.ok) {
          const errorData = await domainResponse.json()
          throw new Error(errorData.message || 'Failed to fetch domain data')
        }
        const domainResult = await domainResponse.json()
        console.log('Domain Data:', domainResult)
        setDomainData(domainResult)

        // Fetch email statistics
        const statsResponse = await fetch('/api/dashboard/stats')
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json()
          throw new Error(errorData.message || 'Failed to fetch email statistics')
        }
        const statsResult = await statsResponse.json()
        console.log('Stats Data:', statsResult)
        setEmailStats(statsResult.stats)

        // Fetch audience data
        const audienceResponse = await fetch('/api/dashboard/audience')
        if (!audienceResponse.ok) {
          const errorData = await audienceResponse.json()
          throw new Error(errorData.message || 'Failed to fetch audience data')
        }
        const audienceResult = await audienceResponse.json()
        console.log('Audience Data:', audienceResult)
        setAudienceData(audienceResult)

        // Fetch events data
        const eventsResponse = await fetch('/api/dashboard/events')
        if (!eventsResponse.ok) {
          const errorData = await eventsResponse.json()
          throw new Error(errorData.message || 'Failed to fetch events data')
        }
        const eventsResult = await eventsResponse.json()
        console.log('Events Data:', eventsResult)
        setEventsData(eventsResult)

        // Fetch domains data for admin users
        if (audienceResult?.isAdmin) {
          const domainsResponse = await fetch('/api/dashboard/domains')
          if (domainsResponse.ok) {
            const domainsResult = await domainsResponse.json()
            console.log('Domains Data:', domainsResult)
            setDomainsData(domainsResult)
          }
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <SidebarProvider>
        <Sidebar className="border-r">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <div className="flex items-center gap-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <Mail className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">WSDMailer</span>
                      <span className="text-xs text-muted-foreground">Dashboard</span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            {getNavigation(audienceData?.isAdmin || false).map((section) => (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                        isActive={item.tab ? activeTab === item.tab : item.isActive}
                        onClick={() => {
                          if (item.tab) {
                            setActiveTab(item.tab)
                          }
                        }}
                        className={item.tab ? "cursor-pointer" : ""}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-2 p-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-6 w-32" />
              <div className="ml-auto flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8 w-48 lg:w-64" disabled />
                </div>
                <Button variant="outline" size="icon" disabled>
                  <Bell className="size-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-4 md:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="emails">Emails</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 md:space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
                <ProgressSkeleton />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4 md:space-y-6">
                <ChartSkeleton />
                <ChartSkeleton />
              </TabsContent>

              <TabsContent value="emails" className="space-y-4 md:space-y-6">
                <TableSkeleton rows={10} />
              </TabsContent>

              <TabsContent value="audience" className="space-y-4 md:space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
                <TableSkeleton rows={8} />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Empty states with proper structure
  const EmptyStateCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: React.ComponentType<{ className?: string }> }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-gray-100">
          <Icon className="size-4 text-gray-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">0</div>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  )

  const EmptyChart = ({ title, description }: { title: string, description: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-64 sm:h-80 flex items-center justify-center">
        <div className="text-center space-y-2">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No data available yet</p>
        </div>
      </CardContent>
    </Card>
  )

  if (error && !domainData) {
    return (
      <SidebarProvider>
        <Sidebar className="border-r">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <div className="flex items-center gap-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <Mail className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">EmailIt</span>
                      <span className="text-xs text-muted-foreground">Dashboard</span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            {getNavigation(audienceData?.isAdmin || false).map((section) => (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                        isActive={item.tab ? activeTab === item.tab : item.isActive}
                        onClick={() => {
                          if (item.tab) {
                            setActiveTab(item.tab)
                          }
                        }}
                        className={item.tab ? "cursor-pointer" : ""}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-2 p-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gray-200">
                    <span className="text-sm font-medium">U</span>
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">User</span>
                    <span className="text-xs text-muted-foreground">user@domain.com</span>
                  </div>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2 flex-1">
              <h1 className="font-semibold">Dashboard - No Data</h1>
              <div className="ml-auto flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8 w-48 lg:w-64" disabled />
                </div>
                <Button variant="outline" size="icon" disabled>
                  <Bell className="size-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-4 md:p-6">
            <div className="text-center space-y-4 py-12">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">No Data Available</h2>
                <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Build email stats cards from API data
  const emailStatCards = emailStats ? [
    {
      title: "Total Sent",
      icon: Send,
      value: emailStats.totalSent.toLocaleString(),
      change: "",
      trend: "up",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Delivered",
      icon: CheckCircle,
      value: emailStats.delivered.toLocaleString(),
      change: `${emailStats.deliveryRate}%`,
      trend: "up",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Failed",
      icon: XCircle,
      value: emailStats.failed.toLocaleString(),
      change: "",
      trend: "down",
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      title: "Opens",
      icon: MailOpen,
      value: emailStats.opens.toLocaleString(),
      change: "",
      trend: "up",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Clicks",
      icon: Zap,
      value: emailStats.clicks.toLocaleString(),
      change: "",
      trend: "up",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Pending",
      icon: Clock,
      value: emailStats.pending.toLocaleString(),
      change: "",
      trend: "up",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    }
  ] : []

  // Build detailed delivery status cards
  const detailedStatusCards = emailStats?.detailedStatus ? [
    {
      title: "Sent Successfully",
      icon: CheckCircle,
      value: emailStats.detailedStatus.sent.toLocaleString(),
      change: "",
      trend: "up",
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Emails successfully delivered"
    },
    {
      title: "Hard Fail",
      icon: XCircle,
      value: emailStats.detailedStatus.hardfail.toLocaleString(),
      change: "",
      trend: "down",
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: "Permanent delivery failures"
    },
    {
      title: "Soft Fail",
      icon: Clock,
      value: emailStats.detailedStatus.softfail.toLocaleString(),
      change: "",
      trend: "down",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Temporary failures, will retry"
    },
    {
      title: "Bounced",
      icon: TrendingDown,
      value: emailStats.detailedStatus.bounce.toLocaleString(),
      change: "",
      trend: "down",
      color: "text-red-500",
      bgColor: "bg-red-50",
      description: "Emails bounced back"
    },
    {
      title: "System Error",
      icon: XCircle,
      value: emailStats.detailedStatus.error.toLocaleString(),
      change: "",
      trend: "down",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      description: "System errors, will retry"
    },
    {
      title: "Held",
      icon: Eye,
      value: emailStats.detailedStatus.held.toLocaleString(),
      change: "",
      trend: "down",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "Account under review"
    },
    {
      title: "Delayed",
      icon: Clock,
      value: emailStats.detailedStatus.delayed.toLocaleString(),
      change: "",
      trend: "down",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      description: "Rate limited, delayed"
    }
  ] : []

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <div className="flex items-center gap-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Mail className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">WSDMailer</span>
                    <span className="text-xs text-muted-foreground">Dashboard</span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        
        <SidebarContent>
          {getNavigation(audienceData?.isAdmin || false).map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={item.tab ? activeTab === item.tab : item.isActive}
                        onClick={() => {
                          if (item.tab) {
                            setActiveTab(item.tab)
                          }
                        }}
                        className={item.tab ? "cursor-pointer" : ""}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gray-200">
                      <span className="text-sm font-medium">
                        {domainData?.userEmail?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-medium">
                        {domainData?.userEmail?.split('@')[0] || 'User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {domainData?.userEmail || 'user@domain.com'}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  <DropdownMenuItem>
                    <Settings className="mr-2 size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 size-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
  <LogoutLink className="text-red-500">
    Sign out
  </LogoutLink>
</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="font-semibold text-sm sm:text-base truncate">
              <span className="hidden sm:inline">Dashboard - {domainData?.userDomain || 'Domain'}</span>
              <span className="sm:hidden">{domainData?.userDomain || 'Dashboard'}</span>
            </h1>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-8 w-36 lg:w-48 xl:w-64" />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 md:hidden">
                <Search className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <Bell className="size-4" />
              </Button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 space-y-6 p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full ${audienceData?.isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              {audienceData?.isAdmin && <TabsTrigger value="domains">Domains</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Email Summary Stats */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {emailStatCards.length > 0 ? emailStatCards.map((stat) => (
                  <Card key={stat.title} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`size-3 sm:size-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                      <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                      {stat.change && (
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground mt-2">
                          <div className="flex items-center">
                            {stat.trend === "up" ? (
                              <TrendingUp className="size-3 sm:size-4 text-green-500 mr-1" />
                            ) : (
                              <TrendingDown className="size-3 sm:size-4 text-red-500 mr-1" />
                            )}
                            <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                              {stat.change}
                            </span>
                          </div>
                          <span>delivery rate</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )) : (
                  <>
                    <EmptyStateCard key="sent" title="Total Sent" description="No emails sent yet" icon={Send} />
                    <EmptyStateCard key="delivered" title="Delivered" description="No deliveries yet" icon={CheckCircle} />
                    <EmptyStateCard key="failed" title="Failed" description="No failures yet" icon={XCircle} />
                    <EmptyStateCard key="opens" title="Opens" description="No opens yet" icon={MailOpen} />
                    <EmptyStateCard key="clicks" title="Clicks" description="No clicks yet" icon={Zap} />
                    <EmptyStateCard key="pending" title="Pending" description="No pending emails" icon={Clock} />
                  </>
                )}
              </div>

              {/* Detailed Delivery Status */}
              {detailedStatusCards.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Detailed Delivery Status</h3>
                    <Badge variant="outline">Last 30 days</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {detailedStatusCards.map((stat) => (
                      <Card key={stat.title} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                          <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                            <stat.icon className={`size-4 ${stat.color}`} />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stat.value}</div>
                          <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Rate Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Performance</CardTitle>
                  <CardDescription>Email delivery success rate for {domainData?.userDomain || 'your domain'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Delivery Rate</span>
                    <span className="text-sm text-muted-foreground">{emailStats?.deliveryRate || 0}%</span>
                  </div>
                  <Progress value={emailStats?.deliveryRate || 0} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{emailStats?.delivered?.toLocaleString() || '0'}</div>
                      <div className="text-sm text-muted-foreground">Delivered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{emailStats?.failed?.toLocaleString() || '0'}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 md:space-y-6">
              {/* Email Volume Chart */}
              {eventsData?.charts?.volume && Array.isArray(eventsData.charts.volume) && eventsData.charts.volume.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Email Volume Over Time</CardTitle>
                    <CardDescription>Track your email sending trends and delivery rates for {domainData?.userDomain}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        total: { label: "Total", color: "#3b82f6" },
                        delivered: { label: "Delivered", color: "#10b981" },
                        failed: { label: "Failed", color: "#ef4444" }
                      }}
                      className="h-64 sm:h-80"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={eventsData.charts.volume} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="delivered" fill="#10b981" name="Delivered" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              ) : (
                <EmptyChart
                  title="Email Volume Over Time"
                  description={`Track your email sending trends and delivery rates for ${domainData?.userDomain || 'your domain'}`}
                />
              )}

              {/* Engagement Chart */}
              {eventsData?.charts?.engagement && Array.isArray(eventsData.charts.engagement) && eventsData.charts.engagement.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Engagement</CardTitle>
                    <CardDescription>Opens and clicks by day of the week for {domainData?.userDomain}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        opens: { label: "Opens", color: "#8b5cf6" },
                        clicks: { label: "Clicks", color: "#f59e0b" }
                      }}
                      className="h-64 sm:h-80"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={eventsData.charts.engagement} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="day_name" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="opens" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              ) : (
                <EmptyChart
                  title="Weekly Engagement"
                  description={`Opens and clicks by day of the week for ${domainData?.userDomain || 'your domain'}`}
                />
              )}
            </TabsContent>

            <TabsContent value="emails" className="space-y-4 md:space-y-6">
              {/* Email List */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Events</CardTitle>
                  <CardDescription>All email events and delivery status for {domainData?.userDomain || 'your domain'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {eventsData?.events && Array.isArray(eventsData.events) && eventsData.events.length > 0 ? (
                      <>
                        {/* Email Events Table */}
                        <div className="rounded-lg border overflow-hidden">
                          <div className="overflow-x-auto">
                            <div className="min-w-[800px] grid grid-cols-12 gap-4 p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground border-b bg-muted/50">
                              <div className="col-span-3">Recipient</div>
                              <div className="col-span-3">Subject</div>
                              <div className="col-span-2">Event Type</div>
                              <div className="col-span-2">Status</div>
                              <div className="col-span-2">Date</div>
                            </div>
                            {eventsData.events.slice(0, 50).map((event: EmailEventData) => (
                              <div key={event.id} className="min-w-[800px] grid grid-cols-12 gap-4 p-3 sm:p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                                <div className="col-span-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex aspect-square size-6 sm:size-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                                      <Mail className="size-3 sm:size-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-xs sm:text-sm truncate">{event.to}</div>
                                      <div className="text-[10px] sm:text-xs text-muted-foreground">{event.from}</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-span-3">
                                  <div className="text-xs sm:text-sm font-medium truncate" title={event.subject}>
                                    {event.subject}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground">ID: {event.emailId}</div>
                                </div>
                                <div className="col-span-2">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    {event.eventType === 'email.loaded' && <Eye className="size-3 sm:size-4 text-purple-600" />}
                                    {event.eventType === 'email.link.clicked' && <MousePointer className="size-3 sm:size-4 text-orange-600" />}
                                    {event.eventType.includes('delivery') && <Send className="size-3 sm:size-4 text-blue-600" />}
                                    <span className="text-xs sm:text-sm capitalize">
                                      {event.eventType.replace('email.', '').replace('.', ' ')}
                                    </span>
                                  </div>
                                </div>
                              <div className="col-span-2">
                                <Badge
                                  variant={
                                    event.status === 'delivered' ? 'default' :
                                    event.status === 'failed' || event.status === 'bounced' ? 'destructive' :
                                    event.status === 'pending' ? 'secondary' :
                                    'outline'
                                  }
                                >
                                  {event.status}
                                </Badge>
                              </div>
                                <div className="col-span-2">
                                  <div className="text-xs sm:text-sm">
                                    {new Date(event.timestamp).toLocaleDateString()}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pagination Info */}
                        {eventsData.pagination && (
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div>
                              Showing {Math.min(eventsData.pagination.offset + 1, eventsData.pagination.total)} to{' '}
                              {Math.min(eventsData.pagination.offset + eventsData.pagination.limit, eventsData.pagination.total)} of{' '}
                              {eventsData.pagination.total} emails
                            </div>
                            {eventsData.pagination.hasMore && (
                              <Button variant="outline" size="sm">
                                Load More
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Emails Yet</h3>
                        <p className="text-sm text-muted-foreground">Email events will appear here once you start sending emails</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4 md:space-y-6">
              {/* Recent Messages */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Messages</CardTitle>
                  <CardDescription>Latest emails sent through your domain</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {eventsData?.events && Array.isArray(eventsData.events) && eventsData.events.length > 0 ? (
                      <>
                        {/* Messages Table */}
                        <div className="rounded-lg border">
                          <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b bg-muted/50">
                            <div className="col-span-3">To</div>
                            <div className="col-span-4">Subject</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Sent Date</div>
                            <div className="col-span-1">Actions</div>
                          </div>
                          {/* Group messages by messageId to show unique emails */}
                          {Object.values(
                            eventsData.events.reduce((acc: { [key: string]: EmailEventData }, event: EmailEventData) => {
                              // Only include delivery events for messages view
                              if (event.eventType.startsWith('email.delivery.')) {
                                if (!acc[event.messageId] || new Date(event.timestamp) > new Date(acc[event.messageId].timestamp)) {
                                  acc[event.messageId] = event;
                                }
                              }
                              return acc;
                            }, {})
                          ).slice(0, 20).map((event: EmailEventData) => (
                            <div key={event.messageId} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                              <div className="col-span-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                                    <Mail className="size-4 text-blue-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm truncate">{event.to}</div>
                                    <div className="text-xs text-muted-foreground">{event.from}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-span-4">
                                <div className="text-sm font-medium truncate" title={event.subject}>
                                  {event.subject}
                                </div>
                                <div className="text-xs text-muted-foreground">ID: {event.emailId}</div>
                              </div>
                              <div className="col-span-2">
                                <Badge
                                  variant={
                                    event.status === 'sent' ? 'default' :
                                    ['hardfail', 'softfail', 'bounce', 'error'].includes(event.status) ? 'destructive' :
                                    ['held', 'delayed'].includes(event.status) ? 'secondary' :
                                    'outline'
                                  }
                                >
                                  {event.status === 'sent' ? 'Delivered' :
                                   event.status === 'hardfail' ? 'Hard Fail' :
                                   event.status === 'softfail' ? 'Soft Fail' :
                                   event.status === 'bounce' ? 'Bounced' :
                                   event.status === 'error' ? 'Error' :
                                   event.status === 'held' ? 'Held' :
                                   event.status === 'delayed' ? 'Delayed' :
                                   event.status}
                                </Badge>
                              </div>
                              <div className="col-span-2">
                                <div className="text-sm">
                                  {new Date(event.timestamp).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                              <div className="col-span-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination Info */}
                        {eventsData.pagination && (
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div>
                              Showing recent messages from {domainData?.userDomain || 'your domain'}
                            </div>
                            {eventsData.pagination.hasMore && (
                              <Button variant="outline" size="sm">
                                Load More Messages
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
                        <p className="text-sm text-muted-foreground">Recent messages will appear here once you start sending emails</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audience" className="space-y-4 md:space-y-6">
              {/* Domain Distribution & Overview */}
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recipient Domains</CardTitle>
                    <CardDescription>Distribution of recipient email domains</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {audienceData?.domainDistribution && Array.isArray(audienceData.domainDistribution) && audienceData.domainDistribution.length > 0 ? (
                        audienceData.domainDistribution.slice(0, 5).map((domain: DomainDistribution) => (
                          <div key={domain.recipient_domain} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{domain.recipient_domain}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground w-12">{domain.unique_recipients}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No recipient domains yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Audience Overview</CardTitle>
                    <CardDescription>Quick stats about your email recipients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Recipients</span>
                      <span className="text-2xl font-bold">{audienceData?.overview?.totalRecipients?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active</span>
                      <span className="text-lg font-semibold text-green-600">{audienceData?.overview?.activeRecipients?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Inactive</span>
                      <span className="text-lg font-semibold text-yellow-600">{audienceData?.overview?.inactiveRecipients?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Bounced</span>
                      <span className="text-lg font-semibold text-red-600">{audienceData?.overview?.bouncedRecipients?.toLocaleString() || '0'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Audience List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Recipients</CardTitle>
                  <CardDescription>Complete list of email addresses that have received emails</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {audienceData?.audience && Array.isArray(audienceData.audience) && audienceData.audience.length > 0 ? (
                      <>
                        {/* Audience Stats Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{audienceData.audience.length}</div>
                            <div className="text-sm text-muted-foreground">Total Recipients</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {audienceData.audience.filter((r: Recipient) => r.status === 'active').length}
                            </div>
                            <div className="text-sm text-muted-foreground">Active</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {audienceData.audience.filter((r: Recipient) => r.status === 'inactive').length}
                            </div>
                            <div className="text-sm text-muted-foreground">Inactive</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {audienceData.audience.filter((r: Recipient) => r.status === 'bounced').length}
                            </div>
                            <div className="text-sm text-muted-foreground">Bounced</div>
                          </div>
                        </div>

                        {/* Recipients Table */}
                        <div className="rounded-lg border overflow-hidden">
                          <div className="overflow-x-auto">
                            <div className="min-w-[700px] grid grid-cols-12 gap-4 p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground border-b bg-muted/50">
                              <div className="col-span-4">Email Address</div>
                              <div className="col-span-2">Domain</div>
                              <div className="col-span-2">Total Emails</div>
                              <div className="col-span-2">Last Seen</div>
                              <div className="col-span-2">Status</div>
                            </div>
                            {audienceData.audience.map((recipient: Recipient) => (
                              <div key={recipient.email} className="min-w-[700px] grid grid-cols-12 gap-4 p-3 sm:p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                                <div className="col-span-4">
                                  <div className="flex items-center gap-2">
                                    <div className="flex aspect-square size-6 sm:size-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                                      <UserCheck className="size-3 sm:size-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-xs sm:text-sm truncate" title={recipient.email}>{recipient.email}</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs sm:text-sm">{recipient.recipient_domain}</div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs sm:text-sm font-medium">{recipient.total_emails}</div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs sm:text-sm">
                                    {new Date(recipient.last_seen).toLocaleDateString()}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                                    {new Date(recipient.last_seen).toLocaleTimeString()}
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <Badge
                                    variant={
                                      recipient.status === 'active' ? 'default' :
                                      recipient.status === 'inactive' ? 'secondary' :
                                      'destructive'
                                    }
                                    className="text-xs"
                                  >
                                    {recipient.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {audienceData.audience.length > 20 && (
                          <div className="text-center text-sm text-muted-foreground">
                            Showing {Math.min(audienceData.audience.length, 100)} recipients
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Recipients Yet</h3>
                        <p className="text-sm text-muted-foreground">Recipients will appear here once you start sending emails</p>
                        {audienceData && (
                          <div className="mt-4 text-xs text-muted-foreground">
                            Debug: {JSON.stringify(audienceData)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {audienceData?.isAdmin && (
              <TabsContent value="domains" className="space-y-4 md:space-y-6">
                {/* Sending Domains */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sending Domains</CardTitle>
                    <CardDescription>All domains configured for email sending</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {domainsData?.domains && domainsData.domains.length > 0 ? (
                        <>
                          {/* Domains Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{domainsData.totalDomains}</div>
                              <div className="text-sm text-muted-foreground">Total Domains</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {domainsData.domains.filter(d => d.totalEmails > 0).length}
                              </div>
                              <div className="text-sm text-muted-foreground">Active Domains</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {domainsData.domains.reduce((sum, d) => sum + d.totalEmails, 0).toLocaleString()}
                              </div>
                              <div className="text-sm text-muted-foreground">Total Emails Sent</div>
                            </div>
                          </div>

                          {/* Domains Table */}
                          <div className="rounded-lg border">
                            <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b bg-muted/50">
                              <div className="col-span-3">Domain Name</div>
                              <div className="col-span-2">Total Emails</div>
                              <div className="col-span-2">Recipients</div>
                              <div className="col-span-2">Last Activity</div>
                              <div className="col-span-2">Status</div>
                              <div className="col-span-1">Actions</div>
                            </div>
                            {domainsData.domains.map((domain) => (
                              <div key={domain.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                                <div className="col-span-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                                      <Send className="size-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-sm">{domain.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Created {new Date(domain.createdAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-sm font-medium">{domain.totalEmails.toLocaleString()}</div>
                                  {domain.summary && (
                                    <div className="text-xs text-muted-foreground">
                                      {domain.summary.totalSent} sent, {domain.summary.totalLoaded} opened
                                    </div>
                                  )}
                                </div>
                                <div className="col-span-2">
                                  <div className="text-sm font-medium">{domain.uniqueRecipients.toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">Unique recipients</div>
                                </div>
                                <div className="col-span-2">
                                  {domain.lastEmailSent ? (
                                    <>
                                      <div className="text-sm">
                                        {new Date(domain.lastEmailSent).toLocaleDateString()}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {new Date(domain.lastEmailSent).toLocaleTimeString()}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">No emails sent</div>
                                  )}
                                </div>
                                <div className="col-span-2">
                                  <Badge
                                    variant={
                                      domain.totalEmails > 0 ? 'default' : 'secondary'
                                    }
                                  >
                                    {domain.totalEmails > 0 ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <div className="col-span-1">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Domains Found</h3>
                          <p className="text-sm text-muted-foreground">No sending domains have been configured yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

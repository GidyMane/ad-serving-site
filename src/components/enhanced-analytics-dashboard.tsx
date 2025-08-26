"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, PieChart, Mail, MousePointer, Eye, AlertTriangle } from 'lucide-react'
import { formatChartDate, formatTooltipDate } from '@/lib/date-utils'
import { useResponsiveChart } from '@/hooks/use-responsive-chart'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart
} from "recharts"

// TypeScript interfaces
interface StatsData {
  totalSent: number;
  delivered: number;
  failed: number;
  opens: number;
  clicks: number;
  pending: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  detailedStatus: {
    sent: number;
    hardfail: number;
    softfail: number;
    bounce: number;
    error: number;
    held: number;
    delayed: number;
  };
  recentActivity: {
    emailsLast7Days: number;
    emailsLast24Hours: number;
    opensLast7Days: number;
    clicksLast7Days: number;
    uniqueRecipients: number;
  };
}

interface VolumeData {
  date: string;
  total: number;
  delivered: number;
  failed: number;
  opens: number;
  clicks: number;
}

interface EngagementData {
  day_name: string;
  opens: number;
  clicks: number;
}

interface EventsData {
  charts: {
    volume: VolumeData[];
    engagement: EngagementData[];
  };
  domainName: string;
}

interface DomainData {
  userDomain: string;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

// Color schemes
const STATUS_COLORS = {
  delivered: "#10b981",
  failed: "#ef4444",
  pending: "#f59e0b",
  hardfail: "#dc2626",
  softfail: "#ea580c",
  bounce: "#d97706",
  error: "#b91c1c",
  held: "#ca8a04",
  delayed: "#eab308"
}

const ENGAGEMENT_COLORS = {
  opened: "#8b5cf6",
  unopened: "#e5e7eb",
  clicked: "#06b6d4",
  notClicked: "#f3f4f6"
}

// Custom label function for pie charts
const renderCustomLabel = (showLabels: boolean) => {
  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) => {
    if (!showLabels || percent < 0.05) return null; // Don't show labels on small screens or for slices smaller than 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={showLabels ? 12 : 10}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  CustomPieLabel.displayName = 'CustomPieLabel';
  return CustomPieLabel;
};

export default function EnhancedAnalyticsDashboard() {
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [eventsData, setEventsData] = useState<EventsData | null>(null)
  const [domainData, setDomainData] = useState<DomainData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const chartSettings = useResponsiveChart()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [statsResponse, eventsResponse, domainResponse] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/events'),
          fetch('/api/dashboard/domain')
        ])

        if (statsResponse.ok) {
          const statsResult = await statsResponse.json()
          setStatsData(statsResult.stats)
        }

        if (eventsResponse.ok) {
          const eventsResult = await eventsResponse.json()
          setEventsData(eventsResult)
        }

        if (domainResponse.ok) {
          const domainResult = await domainResponse.json()
          setDomainData(domainResult)
        }

      } catch (err) {
        console.error('Error fetching analytics data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Prepare pie chart data
  const deliveryStatusPieData: PieData[] = statsData ? [
    { name: 'Delivered', value: statsData.delivered, color: STATUS_COLORS.delivered },
    { name: 'Failed', value: statsData.failed, color: STATUS_COLORS.failed },
    { name: 'Pending', value: statsData.pending, color: STATUS_COLORS.pending }
  ].filter(item => item.value > 0) : []

  const detailedStatusPieData: PieData[] = statsData ? [
    { name: 'Delivered', value: statsData.detailedStatus.sent, color: STATUS_COLORS.delivered },
    { name: 'Hard Fail', value: statsData.detailedStatus.hardfail, color: STATUS_COLORS.hardfail },
    { name: 'Soft Fail', value: statsData.detailedStatus.softfail, color: STATUS_COLORS.softfail },
    { name: 'Bounced', value: statsData.detailedStatus.bounce, color: STATUS_COLORS.bounce },
    { name: 'Error', value: statsData.detailedStatus.error, color: STATUS_COLORS.error },
    { name: 'Held', value: statsData.detailedStatus.held, color: STATUS_COLORS.held },
    { name: 'Delayed', value: statsData.detailedStatus.delayed, color: STATUS_COLORS.delayed }
  ].filter(item => item.value > 0) : []

  const engagementPieData: PieData[] = statsData ? [
    { name: 'Opened', value: statsData.opens, color: ENGAGEMENT_COLORS.opened },
    { name: 'Not Opened', value: Math.max(0, statsData.totalSent - statsData.opens), color: ENGAGEMENT_COLORS.unopened }
  ].filter(item => item.value > 0) : []

  const clicksPieData: PieData[] = statsData ? [
    { name: 'Clicked', value: statsData.clicks, color: ENGAGEMENT_COLORS.clicked },
    { name: 'Not Clicked', value: Math.max(0, statsData.totalSent - statsData.clicks), color: ENGAGEMENT_COLORS.notClicked }
  ].filter(item => item.value > 0) : []

  const ChartSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-48 sm:w-64" />
      </CardHeader>
      <CardContent className="h-48 sm:h-64 md:h-80">
        <div className="w-full h-full flex items-center justify-center">
          <Skeleton className="h-32 w-32 sm:h-48 sm:w-48 md:h-64 md:w-64 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )

  const EmptyChart = ({ title, description, icon: Icon }: { title: string, description: string, icon: React.ElementType }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-80 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Icon className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No data available yet</p>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center space-y-4 py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Failed to Load Analytics</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Enhanced Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive email analytics and performance metrics for {domainData?.userDomain || eventsData?.domainName || 'your domain'}
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.totalSent?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24h: {statsData?.recentActivity?.emailsLast24Hours || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.deliveryRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {statsData?.delivered?.toLocaleString() || 0} delivered
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.openRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {statsData?.opens?.toLocaleString() || 0} opens
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.clickRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {statsData?.clicks?.toLocaleString() || 0} clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="delivery" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
          <TabsTrigger value="delivery">Delivery Status</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="delivery" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Delivery Status Overview */}
            {deliveryStatusPieData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Status Distribution</CardTitle>
                  <CardDescription>Overview of email delivery outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      delivered: { label: "Delivered", color: STATUS_COLORS.delivered },
                      failed: { label: "Failed", color: STATUS_COLORS.failed },
                      pending: { label: "Pending", color: STATUS_COLORS.pending }
                    }}
                    className="h-80"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={deliveryStatusPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel(chartSettings.showLabels)}
                          outerRadius="80%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {deliveryStatusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : (
              <EmptyChart 
                title="Delivery Status Distribution" 
                description="Overview of email delivery outcomes"
                icon={PieChart}
              />
            )}

            {/* Detailed Status Breakdown */}
            {detailedStatusPieData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Status Breakdown</CardTitle>
                  <CardDescription>Granular view of delivery issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      delivered: { label: "Delivered", color: STATUS_COLORS.delivered },
                      hardfail: { label: "Hard Fail", color: STATUS_COLORS.hardfail },
                      softfail: { label: "Soft Fail", color: STATUS_COLORS.softfail },
                      bounce: { label: "Bounced", color: STATUS_COLORS.bounce },
                      error: { label: "Error", color: STATUS_COLORS.error },
                      held: { label: "Held", color: STATUS_COLORS.held },
                      delayed: { label: "Delayed", color: STATUS_COLORS.delayed }
                    }}
                    className="h-48 sm:h-64 md:h-80"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={detailedStatusPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel(chartSettings.showLabels)}
                          outerRadius="80%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {detailedStatusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : (
              <EmptyChart 
                title="Detailed Status Breakdown" 
                description="Granular view of delivery issues"
                icon={PieChart}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Opens Analysis */}
            {engagementPieData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Email Opens</CardTitle>
                  <CardDescription>Emails opened vs not opened</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      opened: { label: "Opened", color: ENGAGEMENT_COLORS.opened },
                      unopened: { label: "Not Opened", color: ENGAGEMENT_COLORS.unopened }
                    }}
                    className="h-48 sm:h-64 md:h-80"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={engagementPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel(chartSettings.showLabels)}
                          outerRadius="80%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {engagementPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : (
              <EmptyChart 
                title="Email Opens" 
                description="Emails opened vs not opened"
                icon={Eye}
              />
            )}

            {/* Clicks Analysis */}
            {clicksPieData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Email Clicks</CardTitle>
                  <CardDescription>Emails clicked vs not clicked</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      clicked: { label: "Clicked", color: ENGAGEMENT_COLORS.clicked },
                      notClicked: { label: "Not Clicked", color: ENGAGEMENT_COLORS.notClicked }
                    }}
                    className="h-48 sm:h-64 md:h-80"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={clicksPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel(chartSettings.showLabels)}
                          outerRadius="80%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {clicksPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : (
              <EmptyChart 
                title="Email Clicks" 
                description="Emails clicked vs not clicked"
                icon={MousePointer}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Email Volume Trends */}
          {eventsData?.charts?.volume && eventsData.charts.volume.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Email Volume Trends</CardTitle>
                <CardDescription>Daily email volume and delivery performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    total: { label: "Total", color: "#3b82f6" },
                    delivered: { label: "Delivered", color: STATUS_COLORS.delivered },
                    failed: { label: "Failed", color: STATUS_COLORS.failed }
                  }}
                  className="h-64 sm:h-80 md:h-96"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={eventsData.charts.volume}
                      margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        tick={{ fontSize: chartSettings.tickFontSize }}
                        angle={chartSettings.axisAngle}
                        textAnchor="end"
                        height={chartSettings.axisHeight}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: chartSettings.tickFontSize }} />
                      <ChartTooltip
                        content={<ChartTooltipContent
                          labelFormatter={(label) => formatTooltipDate(label)}
                        />}
                      />
                      <Area type="monotone" dataKey="total" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="delivered" stackId="2" stroke={STATUS_COLORS.delivered} fill={STATUS_COLORS.delivered} fillOpacity={0.8} />
                      <Area type="monotone" dataKey="failed" stackId="2" stroke={STATUS_COLORS.failed} fill={STATUS_COLORS.failed} fillOpacity={0.8} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : (
            <EmptyChart 
              title="Email Volume Trends" 
              description="Daily email volume and delivery performance over time"
              icon={TrendingUp}
            />
          )}

          {/* Engagement Trends */}
          {eventsData?.charts?.engagement && eventsData.charts.engagement.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Engagement Patterns</CardTitle>
                <CardDescription>Opens and clicks by day of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    opens: { label: "Opens", color: ENGAGEMENT_COLORS.opened },
                    clicks: { label: "Clicks", color: ENGAGEMENT_COLORS.clicked }
                  }}
                  className="h-64 sm:h-80 md:h-96"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={eventsData.charts.engagement}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="day_name"
                        tick={{ fontSize: chartSettings.tickFontSize }}
                        tickFormatter={(value) => value.trim()}
                      />
                      <YAxis tick={{ fontSize: chartSettings.tickFontSize }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="opens" fill={ENGAGEMENT_COLORS.opened} name="Opens" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="clicks" fill={ENGAGEMENT_COLORS.clicked} name="Clicks" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : (
            <EmptyChart 
              title="Weekly Engagement Patterns" 
              description="Opens and clicks by day of the week"
              icon={BarChart3}
            />
          )}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {/* Detailed Status Breakdown Bar Chart */}
          {statsData && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Status Breakdown</CardTitle>
                <CardDescription>All email status categories with counts</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    delivered: { label: "Delivered", color: STATUS_COLORS.delivered },
                    hardfail: { label: "Hard Fail", color: STATUS_COLORS.hardfail },
                    softfail: { label: "Soft Fail", color: STATUS_COLORS.softfail },
                    bounce: { label: "Bounced", color: STATUS_COLORS.bounce },
                    error: { label: "Error", color: STATUS_COLORS.error },
                    held: { label: "Held", color: STATUS_COLORS.held },
                    delayed: { label: "Delayed", color: STATUS_COLORS.delayed }
                  }}
                  className="h-48 sm:h-64 md:h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Delivered', value: statsData.detailedStatus.sent, color: STATUS_COLORS.delivered },
                        { name: 'Hard Fail', value: statsData.detailedStatus.hardfail, color: STATUS_COLORS.hardfail },
                        { name: 'Soft Fail', value: statsData.detailedStatus.softfail, color: STATUS_COLORS.softfail },
                        { name: 'Bounced', value: statsData.detailedStatus.bounce, color: STATUS_COLORS.bounce },
                        { name: 'Error', value: statsData.detailedStatus.error, color: STATUS_COLORS.error },
                        { name: 'Held', value: statsData.detailedStatus.held, color: STATUS_COLORS.held },
                        { name: 'Delayed', value: statsData.detailedStatus.delayed, color: STATUS_COLORS.delayed }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: chartSettings.axisHeight + 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        angle={chartSettings.axisAngle}
                        textAnchor="end"
                        height={chartSettings.axisHeight}
                        tick={{ fontSize: chartSettings.tickFontSize }}
                      />
                      <YAxis tick={{ fontSize: chartSettings.tickFontSize }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[
                          { name: 'Delivered', value: statsData.detailedStatus.sent, color: STATUS_COLORS.delivered },
                          { name: 'Hard Fail', value: statsData.detailedStatus.hardfail, color: STATUS_COLORS.hardfail },
                          { name: 'Soft Fail', value: statsData.detailedStatus.softfail, color: STATUS_COLORS.softfail },
                          { name: 'Bounced', value: statsData.detailedStatus.bounce, color: STATUS_COLORS.bounce },
                          { name: 'Error', value: statsData.detailedStatus.error, color: STATUS_COLORS.error },
                          { name: 'Held', value: statsData.detailedStatus.held, color: STATUS_COLORS.held },
                          { name: 'Delayed', value: statsData.detailedStatus.delayed, color: STATUS_COLORS.delayed }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Emails Sent:</span>
                  <span className="font-medium">{statsData?.recentActivity?.emailsLast7Days?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Opens:</span>
                  <span className="font-medium">{statsData?.recentActivity?.opensLast7Days?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Clicks:</span>
                  <span className="font-medium">{statsData?.recentActivity?.clicksLast7Days?.toLocaleString() || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Last 24 Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Emails Sent:</span>
                  <span className="font-medium">{statsData?.recentActivity?.emailsLast24Hours?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Unique Recipients:</span>
                  <span className="font-medium">{statsData?.recentActivity?.uniqueRecipients?.toLocaleString() || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Delivery Rate:</span>
                  <span className="font-medium">{statsData?.deliveryRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Open Rate:</span>
                  <span className="font-medium">{statsData?.openRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Click Rate:</span>
                  <span className="font-medium">{statsData?.clickRate?.toFixed(1) || 0}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { 
  Users, 
  Mail,
  Search,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

interface Recipient {
  email: string;
  emailDomain: string;
  totalEmails: number;
  deliveredEmails: number;
  failedEmails: number;
  totalOpens: number;
  totalClicks: number;
  openRate: number;
  clickRate: number;
  firstEmailSent: string;
  lastActivity: string;
}

interface OverviewStats {
  totalRecipients: number;
  totalEmailsSent: number;
  totalOpens: number;
  totalClicks: number;
  averageOpenRate: number;
  averageClickRate: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

interface AudienceData {
  recipients: Recipient[];
  overview: OverviewStats;
  pagination: PaginationData;
  domainName: string;
  isAdmin: boolean;
}

export default function AudiencePage() {
  const [audienceData, setAudienceData] = useState<AudienceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when search changes
  }, [searchTerm])

  useEffect(() => {
    fetchAudience()
  }, [searchTerm, currentPage])

  const fetchAudience = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      params.append('page', currentPage.toString())
      params.append('limit', '50')

      const response = await fetch(`/api/dashboard/audience?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audience data')
      }
      const result = await response.json()
      setAudienceData(result)

    } catch (err) {
      console.error('Error fetching audience data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load audience data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getEngagementColor = (rate: number) => {
    if (rate >= 25) return 'text-green-600'
    if (rate >= 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  const TableSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const Pagination = () => {
    if (!audienceData?.pagination || audienceData.pagination.totalPages <= 1) return null;

    const { page, totalPages, hasPrevious, hasMore } = audienceData.pagination;

    return (
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages} ({audienceData.pagination.total.toLocaleString()} total recipients)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(page - 1)}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page > totalPages - 3) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && page < totalPages - 3 && (
              <>
                <MoreHorizontal className="h-4 w-4" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(page + 1)}
            disabled={!hasMore}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        
        {/* Overview Cards Skeleton */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center space-y-4 py-12">
          <Users className="h-16 w-16 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Failed to Load Audience</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
          </div>
          <Button onClick={fetchAudience}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Audience</h1>
        <p className="text-muted-foreground">
          All email recipients for {audienceData?.domainName || 'your domain'}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audienceData?.overview.totalRecipients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {audienceData?.overview.totalEmailsSent.toLocaleString()} total emails sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audienceData?.overview.totalOpens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {audienceData?.overview.totalClicks.toLocaleString()} clicks • {audienceData?.overview.averageOpenRate}% avg open rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audienceData?.overview.averageClickRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average click rate across all recipients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search recipients by email address..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Recipients List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Recipients</CardTitle>
            <CardDescription>
              {audienceData?.recipients.length ? (
                `Showing ${audienceData.recipients.length} of ${audienceData.pagination.total.toLocaleString()} recipients`
              ) : (
                'No recipients found'
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {audienceData?.recipients.length ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {audienceData.recipients.map((recipient) => (
                  <div key={recipient.email} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Recipient Info */}
                      <div className="md:col-span-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate" title={recipient.email}>
                                {recipient.email}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Domain: {recipient.emailDomain}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Email Statistics */}
                      <div className="md:col-span-2">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {recipient.totalEmails} emails
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="text-green-600">{recipient.deliveredEmails} delivered</span>
                            {recipient.failedEmails > 0 && (
                              <span className="text-red-600">{recipient.failedEmails} failed</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Engagement Stats */}
                      <div className="md:col-span-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {recipient.totalOpens} opens
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer className="h-3 w-3" />
                              {recipient.totalClicks} clicks
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className={`font-medium ${getEngagementColor(recipient.openRate)}`}>
                              {recipient.openRate}% open rate
                            </span>
                            <span className={`font-medium ${getEngagementColor(recipient.clickRate)}`}>
                              {recipient.clickRate}% click rate
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="md:col-span-3">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>
                            First email: {formatDate(recipient.firstEmailSent)}
                          </div>
                          <div>
                            Latest activity: {formatDate(recipient.lastActivity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <Pagination />
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No Recipients Found" : "No Recipients Yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchTerm 
                  ? "Try adjusting your search terms to find the recipients you're looking for"
                  : "Recipients will appear here once you start sending emails through your domain"
                }
              </p>
              {searchTerm && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

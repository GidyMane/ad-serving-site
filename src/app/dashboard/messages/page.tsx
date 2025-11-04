"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Mail,
  Search,
  Download,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Minus,
  MousePointer,
  Eye,
  Activity,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  X
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

interface EmailMessage {
  id: string;
  emailId: number;
  messageId: string;
  recipient: string;
  sender: string;
  subject: string;
  domainName: string;
  currentStatus: string;
  statusLabel: string;
  statusType?: string;
  statusDescription?: string;
  sentDate: string;
  firstOpenDate?: string;
  firstClickDate?: string;
  lastEventType?: string;
  lastEventDate?: string;
  userAgent?: string;
  ipAddress?: string;
  analytics: {
    opens: number;
    clicks: number;
    totalEvents: number;
  };
  createdAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

interface MessagesData {
  messages: EmailMessage[];
  pagination: PaginationData;
  domainName: string;
  isAdmin: boolean;
}

export default function MessagesPage() {
  const [messagesData, setMessagesData] = useState<MessagesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState("30")
  const [currentPage, setCurrentPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setSearchTerm(searchInput)
      setCurrentPage(1)
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchInput])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [statusFilter, dateRange])

  useEffect(() => {
    fetchMessages()
  }, [searchTerm, statusFilter, dateRange, currentPage])

  const fetchMessages = async () => {
    try {
      setIsSearching(true)
      if (!messagesData) {
        setLoading(true)
      }
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('page', currentPage.toString())
      params.append('limit', '20')

      // Set date range
      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        params.append('startDate', startDate.toISOString())
      }

      const selectedId = typeof window !== 'undefined' ? localStorage.getItem('selectedDomainId') : null
      if (selectedId && selectedId !== 'all') params.append('domainId', selectedId)
      const response = await fetch(`/api/dashboard/messages?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const result = await response.json()
      setMessagesData(result)

    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  const exportMessages = async () => {
    try {
      // Fetch all messages for export (without pagination)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('limit', '10000') // Large limit to get all results

      // Set date range
      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        params.append('startDate', startDate.toISOString())
      }

      const selectedId = typeof window !== 'undefined' ? localStorage.getItem('selectedDomainId') : null
      if (selectedId && selectedId !== 'all') params.append('domainId', selectedId)
      const response = await fetch(`/api/dashboard/messages?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch data for export')
      }
      const data = await response.json()

      // Create CSV content
      const csvHeaders = [
        'Message ID',
        'Recipient',
        'Sender',
        'Subject',
        'Domain',
        'Status',
        'Sent Date',
        'First Open Date',
        'First Click Date',
        'Total Opens',
        'Total Clicks',
        'Total Events'
      ]

      const csvRows = data.messages.map((message: EmailMessage) => [
        message.messageId,
        message.recipient,
        message.sender,
        message.subject,
        message.domainName,
        message.statusLabel,
        new Date(message.sentDate).toLocaleDateString(),
        message.firstOpenDate ? new Date(message.firstOpenDate).toLocaleDateString() : 'N/A',
        message.firstClickDate ? new Date(message.firstClickDate).toLocaleDateString() : 'N/A',
        message.analytics.opens,
        message.analytics.clicks,
        message.analytics.totalEvents
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row: (string | number)[]) => row.map((cell: string | number) => `"${cell}"`).join(','))
      ].join('\n')

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `messages-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err) {
      console.error('Error exporting messages data:', err)
      setError('Failed to export messages data')
    }
  }

  const getStatusIcon = (type?: string) => {
    switch (type) {
      case 'email.delivery.sent':
        return <CheckCircle className="h-3 w-3" />
      case 'email.delivery.hardfail':
      case 'email.delivery.softfail':
      case 'email.delivery.error':
      case 'email.delivery.bounce':
        return <XCircle className="h-3 w-3" />
      case 'email.delivery.held':
      case 'email.delivery.delayed':
        return <Clock className="h-3 w-3" />
      case 'email.link.clicked':
      case 'email.loaded':
        return <Activity className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  const getStatusVariant = (type?: string) => {
    switch (type) {
      case 'email.delivery.sent':
        return 'default'
      case 'email.delivery.hardfail':
      case 'email.delivery.softfail':
      case 'email.delivery.error':
      case 'email.delivery.bounce':
        return 'destructive'
      case 'email.delivery.held':
      case 'email.delivery.delayed':
        return 'secondary'
      case 'email.link.clicked':
      case 'email.loaded':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const TableSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-6 w-20 rounded-full" />
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
    if (!messagesData?.pagination || messagesData.pagination.totalPages <= 1) return null;

    const { page, totalPages, hasPrevious, hasMore } = messagesData.pagination;

    return (
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages} ({messagesData.pagination.total.toLocaleString()} total messages)
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
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
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
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Failed to Load Messages</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
          </div>
          <Button onClick={fetchMessages}>
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
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          All email messages sent through {messagesData?.domainName || 'your domain'}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            placeholder="Search by recipient, sender, or subject..."
            className="pl-10 pr-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="all">All Status</option>
          <optgroup label="Delivery">
            <option value="email.delivery.sent">Sent</option>
            <option value="email.delivery.hardfail">Hard Fail</option>
            <option value="email.delivery.softfail">Soft Fail</option>
            <option value="email.delivery.bounce">Bounced</option>
            <option value="email.delivery.error">Error</option>
            <option value="email.delivery.held">Held</option>
            <option value="email.delivery.delayed">Delayed</option>
          </optgroup>
          <optgroup label="Engagement">
            <option value="email.loaded">Opened</option>
            <option value="email.link.clicked">Clicked</option>
          </optgroup>
        </select>

        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>
              {messagesData?.messages.length ? (
                `Showing ${messagesData.messages.length} of ${messagesData.pagination.total.toLocaleString()} messages`
              ) : (
                'No messages found'
              )}
            </CardDescription>
          </div>
          {messagesData?.messages.length ? (
            <Button variant="outline" size="sm" onClick={exportMessages}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {messagesData?.messages.length ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {messagesData.messages.map((message) => (
                  <div key={message.messageId} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Email Details */}
                      <div className="md:col-span-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate" title={message.recipient}>
                                <User className="h-3 w-3 inline mr-1" />
                                {message.recipient}
                              </p>
                              <p className="text-xs text-muted-foreground truncate" title={message.sender}>
                                From: {message.sender}
                              </p>
                            </div>
                          </div>
                          <div className="pl-6">
                            <p className="text-xs text-muted-foreground">
                              <FileText className="h-3 w-3 inline mr-1" />
                              Domain: {message.domainName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="md:col-span-3">
                        <div className="space-y-1">
                          <p className="font-medium text-sm truncate" title={message.subject}>
                            {message.subject}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {message.analytics.opens} opens
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer className="h-3 w-3" />
                              {message.analytics.clicks} clicks
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {message.analytics.totalEvents} events
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="md:col-span-2">
                        <Badge variant={getStatusVariant(message.statusType)} className="text-xs">
                          {getStatusIcon(message.statusType)}
                          <span className="ml-1">{message.statusLabel}</span>
                        </Badge>
                        {message.statusDescription && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                            {message.statusDescription}
                          </div>
                        )}
                      </div>

                      {/* Dates and Location */}
                      <div className="md:col-span-3">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Sent: {formatDate(message.sentDate)}</span>
                          </div>
                          {message.firstOpenDate && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>Opened: {formatRelativeTime(message.firstOpenDate)}</span>
                            </div>
                          )}
                          {message.firstClickDate && (
                            <div className="flex items-center gap-1">
                              <MousePointer className="h-3 w-3" />
                              <span>Clicked: {formatRelativeTime(message.firstClickDate)}</span>
                            </div>
                          )}
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
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || statusFilter !== "all" ? "No Messages Found" : "No Messages Yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search terms or filters to find the messages you're looking for"
                  : "Messages will appear here once you start sending emails through your domain"
                }
              </p>
              {(searchTerm || statusFilter !== "all" || dateRange !== "30") && (
                <div className="mt-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setDateRange("30")
                    }}
                  >
                    Clear All Filters
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

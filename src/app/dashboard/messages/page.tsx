"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Mail,
  Search,
  Filter,
  Download,
  Calendar,
  MapPin,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Minus,
  MousePointer
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

interface EmailMessage {
  messageId: string;
  recipient: string;
  sender: string;
  subject: string;
  domainName: string;
  deliveryStatus: string;
  sentDate: string;
  firstOpenDate?: string;
  firstClickDate?: string;
  spamScore?: number;
  lastEventType?: string;
  lastEventDate?: string;
  location?: string;
}

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState("30")

  useEffect(() => {
    fetchMessages()
  }, [searchTerm, statusFilter, dateRange])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      // Set date range
      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        params.append('startDate', startDate.toISOString())
      }

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
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'sent':
        return <CheckCircle className="h-3 w-3" />
      case 'failed':
      case 'bounced':
      case 'rejected':
        return <XCircle className="h-3 w-3" />
      case 'pending':
      case 'queued':
        return <Clock className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'sent':
        return 'default'
      case 'failed':
      case 'bounced':
      case 'rejected':
        return 'destructive'
      case 'pending':
      case 'queued':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    if (!status) return 'Unknown'
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
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

  const getSpamScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground'
    if (score < 3) return 'text-green-600'
    if (score < 7) return 'text-yellow-600'
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by recipient, sender, or subject..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="all">All Status</option>
          <option value="delivered">Delivered</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="bounced">Bounced</option>
          <option value="pending">Pending</option>
          <option value="queued">Queued</option>
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
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {messagesData?.messages.length ? (
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
                        {message.spamScore !== undefined && (
                          <p className={`text-xs ${getSpamScoreColor(message.spamScore)}`}>
                            Spam Score: {message.spamScore}/10
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                      <Badge variant={getStatusVariant(message.deliveryStatus)} className="text-xs">
                        {getStatusIcon(message.deliveryStatus)}
                        <span className="ml-1">{getStatusLabel(message.deliveryStatus)}</span>
                      </Badge>
                    </div>

                    {/* Dates and Analytics */}
                    <div className="md:col-span-3">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Sent: {formatDate(message.sentDate)}</span>
                        </div>
                        {message.firstOpenDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Opened: {formatDate(message.firstOpenDate)}</span>
                          </div>
                        )}
                        {message.firstClickDate && (
                          <div className="flex items-center gap-1">
                            <MousePointer className="h-3 w-3" />
                            <span>Clicked: {formatDate(message.firstClickDate)}</span>
                          </div>
                        )}
                        {message.location && message.location !== 'Unknown' && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{message.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {messagesData.pagination.hasMore && (
                <div className="flex justify-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // TODO: Implement load more functionality
                      console.log('Load more messages')
                    }}
                  >
                    Load More Messages
                  </Button>
                </div>
              )}
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

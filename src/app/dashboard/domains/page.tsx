"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Send,
  Eye,
  Plus,
  Search,
  Filter,
  BarChart3,
  Users
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

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

interface AudienceData {
  isAdmin: boolean;
}

export default function DomainsPage() {
  const [domainsData, setDomainsData] = useState<DomainsData | null>(null)
  const [audienceData, setAudienceData] = useState<AudienceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user is admin first
        const audienceResponse = await fetch('/api/dashboard/audience')
        if (audienceResponse.ok) {
          const audienceResult = await audienceResponse.json()
          setAudienceData(audienceResult)
          
          // Only fetch domains if user is admin
          if (audienceResult.isAdmin) {
            const domainsResponse = await fetch('/api/dashboard/domains')
            if (!domainsResponse.ok) {
              throw new Error('Failed to fetch domains data')
            }
            const domainsResult = await domainsResponse.json()
            setDomainsData(domainsResult)
          } else {
            setError('Access denied. Admin privileges required.')
          }
        } else {
          throw new Error('Failed to verify admin status')
        }

      } catch (err) {
        console.error('Error fetching domains data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load domains data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter domains based on search term and status
  const filteredDomains = React.useMemo(() => {
    if (!domainsData?.domains) return []
    
    let domains = [...domainsData.domains]

    // Filter by search term
    if (searchTerm) {
      domains = domains.filter(domain => 
        domain.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        domains = domains.filter(domain => domain.totalEmails > 0)
      } else if (statusFilter === "inactive") {
        domains = domains.filter(domain => domain.totalEmails === 0)
      }
    }

    return domains.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [domainsData?.domains, searchTerm, statusFilter])

  const getDeliveryRate = (domain: SendingDomain): number => {
    if (!domain.summary || domain.summary.totalSent === 0) return 0
    // Calculate actual delivery rate: delivered emails vs sent emails
    const totalFailed = (domain.summary.totalHardFail || 0) +
                       (domain.summary.totalSoftFail || 0) +
                       (domain.summary.totalBounce || 0) +
                       (domain.summary.totalError || 0)
    const delivered = Math.max(0, domain.summary.totalSent - totalFailed)
    return Math.round((delivered / domain.summary.totalSent) * 100)
  }

  const TableSkeleton = () => (
    <div className="rounded-lg border">
      <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b bg-muted/50">
        <div className="col-span-3">Domain Name</div>
        <div className="col-span-2">Total Emails</div>
        <div className="col-span-2">Recipients</div>
        <div className="col-span-2">Last Activity</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Actions</div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0">
          <div className="col-span-3 flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="col-span-2 space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="col-span-2 space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="col-span-2 space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-8 w-8 rounded" />
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
        
        {/* Overview Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg mb-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
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
          <Send className="h-16 w-16 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {error.includes('Access denied') ? 'Access Denied' : 'Failed to Load Domains'}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
          </div>
          {!error.includes('Access denied') && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!audienceData?.isAdmin) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center space-y-4 py-12">
          <Send className="h-16 w-16 text-gray-400 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Admin Access Required</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              You need administrator privileges to access domain management.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Sending Domains</h1>
          <p className="text-muted-foreground">
            Manage and monitor all domains configured for email sending
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Domain
        </Button>
      </div>

      {/* Domains Summary */}
      {domainsData && (
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
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search domains..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Domains</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Domains Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sending Domains</CardTitle>
          <CardDescription>
            {filteredDomains.length > 0 
              ? `Showing ${filteredDomains.length} domain${filteredDomains.length !== 1 ? 's' : ''}`
              : 'No domains found'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDomains.length > 0 ? (
              <>
                {/* Domains Table */}
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[900px] grid grid-cols-12 gap-4 p-3 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground border-b bg-muted/50">
                      <div className="col-span-3">Domain Name</div>
                      <div className="col-span-2">Total Emails</div>
                      <div className="col-span-2">Recipients</div>
                      <div className="col-span-2">Last Activity</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                    {filteredDomains.map((domain) => (
                      <div key={domain.id} className="min-w-[900px] grid grid-cols-12 gap-4 p-3 sm:p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <div className="col-span-3">
                          <div className="flex items-center gap-2">
                            <div className="flex aspect-square size-6 sm:size-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                              <Send className="size-3 sm:size-4 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-xs sm:text-sm">{domain.name}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">
                                Created {new Date(domain.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs sm:text-sm font-medium">{domain.totalEmails.toLocaleString()}</div>
                          {domain.summary && (
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              {domain.summary.totalSent} sent, {getDeliveryRate(domain)}% delivered
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <Users className="size-3 text-muted-foreground" />
                            <span className="text-xs sm:text-sm font-medium">{domain.uniqueRecipients.toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">Unique recipients</div>
                        </div>
                        <div className="col-span-2">
                          {domain.lastEmailSent ? (
                            <>
                              <div className="text-xs sm:text-sm">
                                {new Date(domain.lastEmailSent).toLocaleDateString()}
                              </div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">
                                {new Date(domain.lastEmailSent).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs sm:text-sm text-muted-foreground">No emails sent</div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={domain.totalEmails > 0 ? 'default' : 'secondary'}
                              className="text-xs w-fit"
                            >
                              {domain.totalEmails > 0 ? 'Active' : 'Inactive'}
                            </Badge>
                            {domain.summary && domain.totalEmails > 0 && (
                              <div className="flex items-center gap-1">
                                <BarChart3 className="size-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {getDeliveryRate(domain)}% delivery
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Domain Stats */}
                {filteredDomains.some(d => d.summary) && (
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {filteredDomains.reduce((sum, d) => sum + (d.summary?.totalSent || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Across all domains
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Opens</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {filteredDomains.reduce((sum, d) => sum + (d.summary?.totalLoaded || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Total email opens
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bounces</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {filteredDomains.reduce((sum, d) => sum + (d.summary?.totalBounce || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Total bounces
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recipients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {filteredDomains.reduce((sum, d) => sum + d.uniqueRecipients, 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Unique recipients
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm || statusFilter !== "all" ? "No Domains Found" : "No Domains Yet"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search criteria or filters"
                    : "No sending domains have been configured yet"
                  }
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <div className="mt-4 space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
                {!searchTerm && statusFilter === "all" && (
                  <Button className="mt-4 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Domain
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

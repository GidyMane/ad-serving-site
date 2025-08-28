"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, RefreshCw, Settings, AlertCircle, CheckCircle } from 'lucide-react'

interface CronSchedule {
  scheduleId: string;
  destination: string;
  cron: string;
  createdAt: string;
  retries: number;
}

interface CronResponse {
  success: boolean;
  schedules?: CronSchedule[];
  count?: number;
  message?: string;
  error?: string;
}

export default function CronManagement() {
  const [schedules, setSchedules] = useState<CronSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/setup-cron')
      const data: CronResponse = await response.json()
      
      if (data.success) {
        setSchedules(data.schedules || [])
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch schedules')
      }
    } catch (err) {
      setError('Network error fetching schedules')
    } finally {
      setLoading(false)
    }
  }

  const manageCron = async (action: 'setup' | 'remove') => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/setup-cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      
      const data: CronResponse = await response.json()
      
      if (data.success) {
        setSuccess(data.message || `Successfully ${action === 'setup' ? 'created' : 'removed'} cron job`)
        await fetchSchedules() // Refresh the list
      } else {
        setError(data.error || `Failed to ${action} cron job`)
      }
    } catch (err) {
      setError(`Network error during ${action}`)
    } finally {
      setLoading(false)
    }
  }

  const testSync = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/cron/sync-domains')
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Domain sync test completed successfully')
      } else {
        setError(data.error || 'Domain sync test failed')
      }
    } catch (err) {
      setError('Network error during sync test')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Domain Sync Cron Jobs
          </CardTitle>
          <CardDescription>
            Manage automatic domain synchronization that runs every 12 hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => manageCron('setup')} 
              disabled={loading}
              variant="default"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
              Setup Cron Job
            </Button>
            
            <Button 
              onClick={() => manageCron('remove')} 
              disabled={loading}
              variant="destructive"
            >
              Remove Cron Jobs
            </Button>
            
            <Button 
              onClick={testSync} 
              disabled={loading}
              variant="outline"
            >
              Test Sync Now
            </Button>
            
            <Button 
              onClick={fetchSchedules} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Schedules List */}
          <div className="space-y-3">
            <h4 className="font-medium">Active Schedules ({schedules.length})</h4>
            
            {schedules.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active cron jobs found</p>
                <p className="text-sm">Click &quot;Setup Cron Job&quot; to create one</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div 
                    key={schedule.scheduleId} 
                    className="p-3 border rounded-lg bg-muted/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {schedule.cron}
                          </Badge>
                          <span className="text-sm font-medium">
                            Every 12 hours
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ID: {schedule.scheduleId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(schedule.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h5 className="font-medium mb-2">Setup Instructions:</h5>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Ensure QSTASH_TOKEN is set in environment variables</li>
              <li>• Verify EMAILIT_API_KEY is configured</li>
              <li>• Set CRON_SECRET for security</li>
              <li>• Cron runs every 12 hours to sync domains</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

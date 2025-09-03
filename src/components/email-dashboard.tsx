"use client"

import * as React from "react"
import { BarChart3, Bell, ChevronDown, FileText, Home, Inbox, Mail, MailOpen, PieChart, Search, Send, Settings, TrendingUp, Users, Zap } from 'lucide-react'
import { TrendingDown } from 'lucide-react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

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

import { EmailCharts } from "./email-charts"
import { EmailList } from "./email-list"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";

const navigation = [
  {
    title: "Main Navigation",
    items: [
      { title: "Dashboard", icon: Home, url: "#", isActive: true },
      { title: "Campaigns", icon: Mail, url: "#", badge: "12" },
      { title: "Templates", icon: FileText, url: "#" },
      { title: "Subscribers", icon: Users, url: "#" },
      { title: "Analytics", icon: BarChart3, url: "#" },
    ]
  },
  {
    title: "Reports",
    items: [
      { title: "Performance", icon: TrendingUp, url: "#" },
      { title: "Engagement", icon: PieChart, url: "#" },
      { title: "A/B Tests", icon: BarChart3, url: "#" },
    ]
  }
]

const stats = [
  { title: "Open Rate", icon: MailOpen, value: "85%", change: "+2%", trend: "up", color: "text-green-500" },
  { title: "Click Rate", icon: Zap, value: "45%", change: "-3%", trend: "down", color: "text-red-500" },
  { title: "Sent Emails", icon: Send, value: "1200", change: "+10%", trend: "up", color: "text-green-500" },
  { title: "Unique Opens", icon: Users, value: "900", change: "-5%", trend: "down", color: "text-red-500" },
]

export function EmailDashboard() {



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
          {navigation.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={item.isActive}>
                        <a href={item.url} className="flex items-center gap-2">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </a>
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
                      <span className="text-sm font-medium">JD</span>
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-medium">John Doe</span>
                      <span className="text-xs text-muted-foreground">john doe @emailit.com</span>
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
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 flex-1">
            <h1 className="font-semibold">Dashboard</h1>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-8 w-48 lg:w-64" />
              </div>
              <Button variant="outline" size="icon">
                <Bell className="size-4" />
              </Button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 space-y-8 p-6">
          {/* Key Metrics - Top Priority */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className={`size-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center">
                      {stat.trend === "up" ? (
                        <TrendingUp className="size-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="size-4 text-red-500 mr-1" />
                      )}
                      <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                        {stat.change}
                      </span>
                    </div>
                    <span>vs last month</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Chart - Secondary Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Email Performance Overview</CardTitle>
              <CardDescription>
                Track your email sending trends and engagement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailCharts />
            </CardContent>
          </Card>

          {/* Recent Campaigns - Tertiary Priority */}
          <EmailList />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BarChart3,
  ChevronDown,
  FileText,
  Home,
  Inbox,
  LogOut,
  Mail,
  Moon,
  Send,
  Sun,
  Users
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs"

interface DomainData {
  domain: {
    id: string;
    name: string;
    emailCount: number;
    summary: unknown;
    createdAt: string;
    updatedAt: string;
  };
  userEmail: string;
  userDomain: string;
}

interface AudienceData {
  isAdmin: boolean;
}

const getNavigation = (isAdmin: boolean = false) => [
  {
    title: "Main Navigation",
    items: [
      { title: "Overview", href: "/dashboard", icon: Home },
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { title: "Messages", href: "/dashboard/messages", icon: Send },
      { title: "Audience", href: "/dashboard/audience", icon: Users },
      ...(isAdmin ? [{ title: "Domains", href: "/dashboard/domains", icon: Send }] : []),
    ]
  },
  {
    title: "Email Tools",
    items: [
      { title: "Campaigns", href: "#", icon: Mail },
      { title: "Templates", href: "#", icon: FileText },
      { title: "Inbox", href: "#", icon: Inbox },
    ]
  }
]

// Mobile-aware navigation link component
function NavLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) {
  const { isMobile, setOpenMobile } = useSidebar()

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarMenuButton asChild isActive={isActive}>
      <Link href={href} className="flex items-center gap-2" onClick={handleClick}>
        {children}
      </Link>
    </SidebarMenuButton>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [domainData, setDomainData] = useState<DomainData | null>(null)
  const [audienceData, setAudienceData] = useState<AudienceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Theme toggle functionality
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDarkMode
    setIsDarkMode(newIsDark)
    document.documentElement.classList.toggle('dark', newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
  }

  // Fetch user and domain data for layout
  useEffect(() => {
    const fetchLayoutData = async () => {
      try {
        // Fetch domain data for user info
        const domainResponse = await fetch('/api/dashboard/domain')
        if (domainResponse.ok) {
          const domainResult = await domainResponse.json()
          setDomainData(domainResult)
        }

        // Fetch audience data to check admin status
        const audienceResponse = await fetch('/api/dashboard/audience')
        if (audienceResponse.ok) {
          const audienceResult = await audienceResponse.json()
          setAudienceData(audienceResult)
        }
      } catch (error) {
        console.error('Error fetching layout data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLayoutData()
  }, [])

  const navigation = getNavigation(audienceData?.isAdmin || false)

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Mail className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">WSDMailer</span>
                    <span className="text-xs text-muted-foreground">Dashboard</span>
                  </div>
                </Link>
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
                      <NavLink
                        href={item.href}
                        isActive={
                          item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname?.startsWith(item.href)
                        }
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </NavLink>
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
                        {loading ? 'U' : (domainData?.userEmail?.charAt(0).toUpperCase() || 'U')}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-medium">
                        {loading ? 'Loading...' : (domainData?.userEmail?.split('@')[0] || 'User')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {loading ? 'user@domain.com' : (domainData?.userEmail || 'user@domain.com')}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  <DropdownMenuItem asChild>
                    <LogoutLink className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 font-medium">
                      <LogOut className="mr-2 size-4" />
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
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sm sm:text-base truncate">
                <span className="hidden sm:inline">Dashboard - {domainData?.userDomain || 'Domain'}</span>
                <span className="sm:hidden">{domainData?.userDomain || 'Dashboard'}</span>
              </h1>
              {domainData?.domain && (
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {domainData.domain.emailCount > 0
                    ? `${domainData.domain.emailCount.toLocaleString()} emails sent`
                    : 'No emails sent yet'
                  }
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Dark/Light Mode Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 sm:h-10 sm:w-10"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>

              {/* User Menu with Prominent Logout */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 sm:h-10 px-2 sm:px-3 gap-2">
                    <div className="flex aspect-square size-6 sm:size-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-medium">
                      {loading ? 'U' : (domainData?.userEmail?.charAt(0).toUpperCase() || 'U')}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {loading ? 'User' : (domainData?.userEmail?.split('@')[0] || 'User')}
                    </span>
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">
                      {loading ? 'Loading...' : (domainData?.userEmail?.split('@')[0] || 'User')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {loading ? 'user@domain.com' : (domainData?.userEmail || 'user@domain.com')}
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <LogoutLink className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 font-medium w-full flex items-center px-3 py-2">
                      <LogOut className="mr-2 size-4" />
                      Sign out
                    </LogoutLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

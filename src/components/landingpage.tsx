"use client"

import { Button } from "@/components/ui/button"
import { Mail } from 'lucide-react'
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs"

export function LandingPage() {
  const currentYear = new Date().getFullYear()
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Mail className="size-4" />
            </div>
            <span className="text-xl font-bold">WSDMailer</span>
          </div>
          
          <LoginLink>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Log In
            </Button>
          </LoginLink>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center text-center space-y-8 max-w-2xl mx-auto">
            {/* Logo */}
            <div className="flex aspect-square size-16 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Mail className="size-8" />
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              WSDMailer
              <span className="text-blue-600"> Dashboard</span>
            </h1>
            
            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Track, monitor, and analyze your email campaigns with comprehensive analytics. 
              Get insights into delivery rates, open rates, click rates, and audience engagement 
              all in one powerful dashboard.
            </p>
            
            {/* Login Button */}
            <LoginLink>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                Access Dashboard
              </Button>
            </LoginLink>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center gap-2">
              <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Mail className="size-3" />
              </div>
              <span className="font-semibold">WSDMailer</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {currentYear} WSDMailer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

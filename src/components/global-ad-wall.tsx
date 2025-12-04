"use client"

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GlobalAdWallProps {
  imageUrl?: string
  headline: string
  description?: string
  ctaText: string
  ctaLink: string
  delayMs?: number
  sessionKey?: string
}

export function GlobalAdWall({
  imageUrl = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  headline,
  description,
  ctaText,
  ctaLink,
  delayMs = 2500,
  sessionKey = 'ad_wall_viewed',
}: GlobalAdWallProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if ad has already been viewed in this session
    const hasViewed = sessionStorage.getItem(sessionKey)
    
    if (!hasViewed) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, delayMs)

      return () => clearTimeout(timer)
    } else {
      setIsReady(true)
    }
  }, [delayMs, sessionKey])

  const handleClose = () => {
    setIsVisible(false)
    sessionStorage.setItem(sessionKey, 'true')
    setIsReady(true)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Don't render anything until component is ready (either ad shown or already viewed)
  if (!isReady && !isVisible) {
    return null
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      className="global-ad-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="global-ad-content">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="global-ad-close"
          aria-label="Close advertisement"
        >
          <X className="size-5" />
        </button>

        {/* Image */}
        {imageUrl && (
          <div className="global-ad-image-wrapper">
            <img
              src={imageUrl}
              alt="Advertisement"
              className="global-ad-image"
            />
          </div>
        )}

        {/* Content */}
        <div className="global-ad-text-content">
          <h2 className="global-ad-headline">{headline}</h2>
          {description && (
            <p className="global-ad-description">{description}</p>
          )}

          {/* CTA Button */}
          <div className="global-ad-cta-wrapper">
            <a href={ctaLink}>
              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                {ctaText}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdModalProps {
  imageUrl?: string
  headline: string
  description?: string
  ctaText: string
  ctaLink: string
  delayMs?: number
}

export function AdModal({
  imageUrl = 'https://images.unsplash.com/photo-1551432494-5fefe8c9ef14?w=800&q=80',
  headline,
  description,
  ctaText,
  ctaLink,
  delayMs = 2500,
}: AdModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [delayMs])

  const handleClose = () => {
    setIsVisible(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isVisible) return null

  return (
    <div
      className="ad-modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="ad-modal-content">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="ad-modal-close"
          aria-label="Close advertisement"
        >
          <X className="size-5" />
        </button>

        {/* Image */}
        {imageUrl && (
          <div className="ad-modal-image-wrapper">
            <img
              src={imageUrl}
              alt="Advertisement"
              className="ad-modal-image"
            />
          </div>
        )}

        {/* Content */}
        <div className="ad-modal-text-content">
          <h2 className="ad-modal-headline">{headline}</h2>
          {description && (
            <p className="ad-modal-description">{description}</p>
          )}

          {/* CTA Button */}
          <div className="ad-modal-cta-wrapper">
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

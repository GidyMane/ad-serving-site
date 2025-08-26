import { useState, useEffect } from 'react'

export interface ResponsiveChartSettings {
  tickFontSize: number
  axisAngle: number
  axisHeight: number
  showLabels: boolean
}

export function useResponsiveChart(): ResponsiveChartSettings {
  const [settings, setSettings] = useState<ResponsiveChartSettings>({
    tickFontSize: 11,
    axisAngle: -45,
    axisHeight: 60,
    showLabels: true,
  })

  useEffect(() => {
    const updateSettings = () => {
      const width = window.innerWidth

      if (width < 480) {
        // Mobile settings
        setSettings({
          tickFontSize: 10,
          axisAngle: 0,
          axisHeight: 40,
          showLabels: false,
        })
      } else if (width < 768) {
        // Tablet settings
        setSettings({
          tickFontSize: 10,
          axisAngle: -30,
          axisHeight: 50,
          showLabels: true,
        })
      } else {
        // Desktop settings
        setSettings({
          tickFontSize: 11,
          axisAngle: -45,
          axisHeight: 60,
          showLabels: true,
        })
      }
    }

    // Set initial settings
    updateSettings()

    // Listen for window resize
    window.addEventListener('resize', updateSettings)
    
    return () => {
      window.removeEventListener('resize', updateSettings)
    }
  }, [])

  return settings
}

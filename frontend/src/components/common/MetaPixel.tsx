import { useEffect, useRef } from 'react'
import { settingsApi } from '../../services/api'

interface MetaPixelProps {
  pixelId?: string
}

const MetaPixel = ({ pixelId }: MetaPixelProps) => {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const initPixel = (id: string) => {
      console.log(`[MetaPixel] Initializing with Pixel ID: ${id}`)
      const w = window as any
      if (!w.fbq) {
        w.fbq = function(...args: any[]) {
          w.fbq.callMethod ? w.fbq.callMethod.apply(w.fbq, args) : w.fbq.queue.push(args)
        }
        if (!w._fbq) w._fbq = w.fbq
        w.fbq.push = w.fbq
        w.fbq.loaded = true
        w.fbq.version = '2.0'
        w.fbq.queue = []
      }
      w.fbq('init', id)
      w.fbq('track', 'PageView')
    }

    if (pixelId) {
      console.log('[MetaPixel] Using per-form Pixel ID')
      initPixel(pixelId)
      return
    }

    const envPixelId = import.meta.env.VITE_META_PIXEL_ID
    console.log('[MetaPixel] VITE_META_PIXEL_ID from env:', envPixelId || '(empty)')
    if (envPixelId && envPixelId !== 'YOUR_PIXEL_ID_HERE') {
      console.log('[MetaPixel] Using env var Pixel ID')
      initPixel(envPixelId)
      return
    }

    console.log('[MetaPixel] No Pixel ID from props or env, fetching from Settings API...')
    settingsApi.getAll().then(res => {
      const id = res.data.data?.meta_pixel_id
      console.log('[MetaPixel] Settings API response:', res.data)
      if (id) {
        console.log('[MetaPixel] Using Settings API Pixel ID:', id)
        initPixel(id)
      } else {
        console.warn('[MetaPixel] No meta_pixel_id found in settings API response')
      }
    }).catch((err) => {
      console.error('[MetaPixel] Failed to fetch settings:', err.message)
    })
  }, [pixelId])

  return null
}

export default MetaPixel

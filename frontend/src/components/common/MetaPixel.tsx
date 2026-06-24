import { useEffect, useRef } from 'react'
import api, { settingsApi } from '../../services/api'

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
        const n = w.fbq = function(this: any, ...args: any[]) {
          n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args)
        }
        if (!w._fbq) w._fbq = n
        n.push = n
        n.loaded = true
        n.version = '2.0'
        n.queue = []
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://connect.facebook.net/en_US/fbevents.js'
        const firstScript = document.getElementsByTagName('script')[0]
        if (firstScript?.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript)
        }
      }
      w.fbq('init', id)
      w.fbq('track', 'PageView')
      api.post('/meta/event', {
        eventName: 'PageView',
        pixelId: id,
        userData: {},
        customData: {}
      }).then(r => console.log('[MetaPixel] PageView CAPI response:', r.status))
        .catch(e => console.error('[MetaPixel] PageView CAPI error:', e.message))
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

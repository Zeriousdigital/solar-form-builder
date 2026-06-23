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
      initPixel(pixelId)
      return
    }

    const envPixelId = import.meta.env.VITE_META_PIXEL_ID
    if (envPixelId && envPixelId !== 'YOUR_PIXEL_ID_HERE') {
      initPixel(envPixelId)
      return
    }

    settingsApi.getAll().then(res => {
      const id = res.data.data?.meta_pixel_id
      if (id) {
        initPixel(id)
      }
    }).catch(() => {})
  }, [pixelId])

  return null
}

export default MetaPixel

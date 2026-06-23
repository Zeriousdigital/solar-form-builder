declare global {
  interface Window {
    fbq: any
  }
}

export const fbq = {
  track: (event: string, data?: any) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', event, data)
    } else {
      console.log('Meta Pixel not available:', event, data)
    }
  },
  trackCustom: (event: string, data?: any) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', event, data)
    } else {
      console.log('Meta Pixel not available (custom):', event, data)
    }
  }
}

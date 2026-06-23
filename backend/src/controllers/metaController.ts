import { Request, Response, NextFunction } from 'express'
import { sendToCAPI } from '../services/metaService'

export const sendMetaEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventName, userData, customData, eventSourceUrl } = req.body

    if (!eventName) {
      res.status(400).json({
        success: false,
        error: 'eventName is required'
      })
      return
    }

    const validEvents = ['Lead', 'PageView', 'CompleteRegistration', 'Subscribe', 'StartTrial']
    if (!validEvents.includes(eventName)) {
      res.status(400).json({
        success: false,
        error: `Invalid eventName. Must be one of: ${validEvents.join(', ')}`
      })
      return
    }

    const result = await sendToCAPI({
      eventName,
      userData: userData || {},
      customData: customData || {},
      eventSourceUrl
    })

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

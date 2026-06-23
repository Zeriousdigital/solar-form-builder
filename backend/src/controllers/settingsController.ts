import { Request, Response, NextFunction } from 'express'
import { getSetting, getSettings, upsertSettings } from '../services/settingsService'

export const getAllSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await getSettings()
    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
}

export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { settings } = req.body
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ success: false, error: 'settings object is required' })
      return
    }
    await upsertSettings(settings)
    const updated = await getSettings()
    res.json({ success: true, data: updated, message: 'Settings updated successfully' })
  } catch (error) {
    next(error)
  }
}

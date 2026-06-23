import { Request, Response, NextFunction } from 'express'

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized - missing or invalid token format'
    })
    return
  }

  const token = authHeader.split(' ')[1]
  const validToken = process.env.ADMIN_TOKEN || 'admin-token-123'

  if (token !== validToken) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized - invalid token'
    })
    return
  }

  next()
}

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { getAllSettings, updateSettings } from '../controllers/settingsController'

const router: Router = Router()

router.get('/', getAllSettings)
router.put('/', authMiddleware, updateSettings)

export default router

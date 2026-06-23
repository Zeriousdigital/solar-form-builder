import { Router } from 'express'
import { sendMetaEvent } from '../controllers/metaController'

const router: Router = Router()

router.post('/event', sendMetaEvent)

export default router

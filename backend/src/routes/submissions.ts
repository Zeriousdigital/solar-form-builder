import { Router } from 'express'
import { createSubmission, getFormSubmissions } from '../controllers/submissionController'

const router: Router = Router()

router.post('/', createSubmission)
router.get('/:formId', getFormSubmissions)

export default router

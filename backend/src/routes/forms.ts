import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getAllForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  publishForm,
  draftForm
} from '../controllers/formController'

const router: Router = Router()

router.get('/', getAllForms)
router.get('/:id', getFormById)
router.post('/', authMiddleware, createForm)
router.put('/:id', authMiddleware, updateForm)
router.delete('/:id', authMiddleware, deleteForm)
router.post('/:id/publish', authMiddleware, publishForm)
router.post('/:id/draft', authMiddleware, draftForm)

export default router

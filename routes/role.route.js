import express from 'express';
import permissionRoute from './permission.route.js'
import * as roleController from '../controllers/role.controller.js'

const router = express.Router();

router.use('/permission', permissionRoute)

router.get('/', roleController.getAll)
router.get('/:id', roleController.getOne)

router.post('/', roleController.create)

router.put('/:id', roleController.update)

router.delete('/:id', roleController.deleteRole)

export default router;
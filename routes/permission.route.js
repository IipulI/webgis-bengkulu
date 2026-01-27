import express from 'express';
import * as permissionController from '../controllers/permission.controller.js'

const router = express.Router();

router.get('/', permissionController.getAll)

router.post('/', permissionController.create)

router.put('/:id', permissionController.update)

router.delete('/:id', permissionController.destroy)

export default router;
import express from 'express';
import * as layerSchemaController from '../controllers/layer-schema.controller.js'

const router = express.Router();

router.get('/', layerSchemaController.getAllLayerSchemas)
router.get('/:id', layerSchemaController.getOneLayerSchema)

router.post('/', layerSchemaController.createLayerSchema)

router.put('/:id', layerSchemaController.updateLayerSchema)

router.delete('/:id', layerSchemaController.deleteLayerSchema)

export default router;
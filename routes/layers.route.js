import express from 'express';
import {
    getLayers,
    getLayerGeoJSON,
    createLayer,
    updateLayer,
    deleteLayer,
    toggleLayerOnOff,
    getDetailLayer
} from '../controllers/layer.controller.js';

const router = express.Router();

router.get('/', getLayers);
router.get('/:id', getDetailLayer);
router.get('/:id/geojson', getLayerGeoJSON);

router.post('/', createLayer);

router.put('/:id', updateLayer);

router.delete('/:id', deleteLayer);

router.patch('/:id', toggleLayerOnOff);

export default router;
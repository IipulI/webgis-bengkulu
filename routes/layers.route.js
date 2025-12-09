import express from 'express';
import { checkJwt } from "../middleware/jwt.middleware.js";
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

router.post('/', checkJwt(), createLayer);

router.put('/:id', checkJwt(), updateLayer);

router.delete('/:id', checkJwt(), deleteLayer);

router.patch('/:id', checkJwt(), toggleLayerOnOff);

export default router;
import express from 'express';
import { checkJwt } from "../middleware/jwt.middleware.js";
import importRoute from "./import.route.js";
import {
    getLayers,
    getLayerGeoJSON,
    createLayer,
    updateLayer,
    deleteLayer,
    toggleLayerOnOff,
    getDetailLayer
} from '../controllers/layer.controller.js';
import { downloadLayerShp } from "../controllers/export.controller.js";

const router = express.Router();

router.get('/', getLayers);
router.get('/:id', getDetailLayer);
router.get('/:id/geojson', getLayerGeoJSON);
router.get('/:id/export', downloadLayerShp);

router.post('/', checkJwt(), createLayer);
router.use('/', importRoute)

router.put('/:id', checkJwt(), updateLayer);

router.delete('/:id', checkJwt(), deleteLayer);

router.patch('/:id', checkJwt(), toggleLayerOnOff);

export default router;
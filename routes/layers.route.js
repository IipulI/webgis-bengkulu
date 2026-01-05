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
import { attachCurrentUser } from "../middleware/attach-user.middleware.js";

const router = express.Router();

router.get('/', getLayers);
router.get('/:id', getDetailLayer);
router.get('/:id/geojson', checkJwt('optional'), attachCurrentUser, getLayerGeoJSON);
router.get('/:id/export', downloadLayerShp);

router.post('/', checkJwt(), createLayer);
router.use('/', importRoute)

router.put('/:id', checkJwt(), updateLayer);

router.delete('/:id', checkJwt(), deleteLayer);

router.patch('/:id', checkJwt(), toggleLayerOnOff);

export default router;
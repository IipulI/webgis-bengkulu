import express from 'express';
import { getLayers, getLayerGeoJSON } from '../controllers/layer.controller.js';

const router = express.Router();

// Public Routes (Bisa diakses tanpa login dulu untuk dev)
router.get('/', getLayers);              // GET /api/layers
router.get('/:id/geojson', getLayerGeoJSON); // GET /api/layers/uuid-ini/geojson

export default router;
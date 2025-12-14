import express from 'express';
import * as featureController from '../controllers/feature.controller.js'
import { getAssetStatistic } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get('/statistic', getAssetStatistic)
router.get('/:layerId/:featureId', featureController.getOneFeature)

router.post('/:layerId', featureController.createFeature)

router.put('/:layerId/:featureId', featureController.updateFeature)

router.delete('/:layerId/:featureId', featureController.deleteFeature)

export default router;
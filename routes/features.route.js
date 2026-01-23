import express from 'express';
import * as featureController from '../controllers/feature.controller.js'
import { getAssetStatistic } from "../controllers/dashboard.controller.js";
import { checkJwt } from "../middleware/jwt.middleware.js";

const router = express.Router();

router.get('/statistic', getAssetStatistic)
router.get('/:layerId/:featureId', checkJwt(), featureController.getOneFeature)

router.post('/:layerId', checkJwt(), featureController.createFeature)

router.put('/:layerId/:featureId', checkJwt(), featureController.updateFeature)

router.delete('/:layerId/:featureId', checkJwt(), featureController.deleteFeature)

export default router;
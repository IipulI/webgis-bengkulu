import { Router } from 'express';
import { authController } from "../controllers/auth.controller.js";
import { getAssetReport } from "../controllers/report.controller.js";
import { formatter, getUuidList } from "../controllers/other.controller.js";
import { validateLogin } from "../validators/auth.validator.js";
import { checkJwt } from "../middleware/jwt.middleware.js";
// import { attachCurrentUser } from "../middleware/attach-user.middleware.js";
// import { checkRole } from "../middleware/authorization.middleware.js";

import layerRouter from "./layers.route.js"
import featureRouter from "./features.route.js"
import attachmentRoutes from "./attachment.route.js"
import layerSchemaRoute from "./layer-schema.route.js";
import { getCategoryReport, getSubCategoryReport } from "../controllers/report.controller.js"

const router = Router();

router.post('/auth/login', validateLogin, authController.handleLogin)
router.get('/report', checkJwt(), getAssetReport)

router.get('/category', getCategoryReport)
router.get('/sub-category', getSubCategoryReport)

router.use('/layer', layerRouter)
router.use('/feature', checkJwt(), featureRouter)
router.use('/attachment', checkJwt(), attachmentRoutes);
router.use('/layer-schema', layerSchemaRoute)


// for dev tool
router.get('/utils//formatter', formatter)
router.get('/utils/uuid-generate', getUuidList)

export default router;
import { Router } from 'express';
import { authController } from "../controllers/auth.controller.js";
import { getAssetReport } from "../controllers/report.controller.js";
import { validateLogin } from "../validators/auth.validator.js";
// import { checkJwt } from "../middleware/jwt.middleware.js";
// import { attachCurrentUser } from "../middleware/attach-user.middleware.js";
// import { checkRole } from "../middleware/authorization.middleware.js";

import layerRouter from "./layers.route.js"
import featureRouter from "./features.route.js"
import attachmentRoutes from "./attachment.route.js"

const router = Router();

router.post('/auth/login', validateLogin, authController.handleLogin)
router.get('/report', getAssetReport)

router.use('/layer', layerRouter)
router.use('/feature', featureRouter)
router.use('/attachment', attachmentRoutes);

export default router;
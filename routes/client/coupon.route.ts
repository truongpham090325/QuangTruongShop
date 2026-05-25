import { Router } from "express";
import * as couponController from "../../controllers/client/coupon.controller";

const router = Router();

router.post("/check", couponController.check);

export default router;

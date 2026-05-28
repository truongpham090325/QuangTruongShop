import { Router } from "express";
import * as orderController from "../../controllers/client/order.controller";
import * as orderValidate from "../../validations/client/order.validate";

const router = Router();

router.post("/create", orderValidate.createPost, orderController.createPost);

router.get("/success", orderController.success);

router.get("/payment-zalopay", orderController.paymentZaloPay);

router.post("/payment-zalopay-result", orderController.paymentZalopayResult);

router.get("/track", orderController.track);

export default router;

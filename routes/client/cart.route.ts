import { Router } from "express";
import * as cartController from "../../controllers/client/cart.controller";

const router = Router();

router.get("/", cartController.cart);

export default router;

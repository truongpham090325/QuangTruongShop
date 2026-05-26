import { Router } from "express";
import * as productController from "../../controllers/client/product.controller";

const router = Router();

router.get("/category/:slug", productController.productByCategory);

export default router;

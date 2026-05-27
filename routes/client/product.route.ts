import { Router } from "express";
import * as productController from "../../controllers/client/product.controller";

const router = Router();

router.get("/suggest", productController.suggest);

router.get("/category/:slug", productController.productByCategory);

router.get("/detail/:slug", productController.detail);

export default router;

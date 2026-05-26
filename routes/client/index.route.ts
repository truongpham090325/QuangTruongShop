import { Router } from "express";
import homeRoutes from "./home.route";
import productRoutes from "./product.route";

const router = Router();

router.use("/", homeRoutes);
router.use("/product", productRoutes);

export default router;

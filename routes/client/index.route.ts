import { Router } from "express";
import homeRoutes from "./home.route";
import productRoutes from "./product.route";
import { categoryMiddleware } from "../../middlewares/client/category.middleware";

const router = Router();

router.use(categoryMiddleware);

router.use("/", homeRoutes);
router.use("/product", productRoutes);

export default router;

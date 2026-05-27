import { Router } from "express";
import homeRoutes from "./home.route";
import productRoutes from "./product.route";
import searchRoutes from "./search.route";
import cartRoutes from "./cart.route";
import { categoryMiddleware } from "../../middlewares/client/category.middleware";

const router = Router();

router.use(categoryMiddleware);

router.use("/", homeRoutes);
router.use("/product", productRoutes);
router.use("/search", searchRoutes);
router.use("/cart", cartRoutes);

export default router;

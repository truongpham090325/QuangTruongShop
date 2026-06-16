import { Router } from "express";
import homeRoutes from "./home.route";
import productRoutes from "./product.route";
import searchRoutes from "./search.route";
import cartRoutes from "./cart.route";
import checkoutRoutes from "./checkout.route";
import orderRoutes from "./order.route";
import chatRoutes from "./chat.route";
import { categoryMiddleware } from "../../middlewares/client/category.middleware";

const router = Router();

router.use(categoryMiddleware);

router.use("/", homeRoutes);
router.use("/product", productRoutes);
router.use("/search", searchRoutes);
router.use("/cart", cartRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/order", orderRoutes);
router.use("/chat", chatRoutes);

export default router;

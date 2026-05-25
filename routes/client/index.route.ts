import { Router } from "express";
import homeRoutes from "./home.route";
import blogRoutes from "./blog.route";
import productRoutes from "./product.route";
import cartRoutes from "./cart.route";
import compareRoutes from "./compare.route";
import wishlistRoutes from "./wishlist.route";
import authRoutes from "./auth.route";
import dashboardRoutes from "./dashboard.route";
import coutponRoutes from "./coupon.route";
import checkoutRoutes from "./checkout.route";
import orderRoutes from "./order.route";

import * as categoryMiddleware from "../../middlewares/client/category.middleware";
import * as attributeMiddleware from "../../middlewares/client/attribute.middleware";
import * as authMiddleware from "../../middlewares/client/auth.middleware";

const router = Router();

router.use(categoryMiddleware.getAllCategory);
router.use(attributeMiddleware.getAttributeProduct);
router.use(authMiddleware.verifyToken);

router.use("/", homeRoutes);
router.use("/blog", blogRoutes);
router.use("/product", productRoutes);
router.use("/cart", cartRoutes);
router.use("/compare", compareRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/auth", authRoutes);
router.use("/dashboard", authMiddleware.loggedIn, dashboardRoutes);
router.use("/coupon", coutponRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/order", orderRoutes);

export default router;

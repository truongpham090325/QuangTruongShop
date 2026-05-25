import { Router } from "express";
import * as blogController from "../../controllers/client/blog.controller";
import * as blogMiddleware from "../../middlewares/client/blog.middleware";

const router = Router();

router.get(
  "/category/:slug",
  blogMiddleware.getPopularBlog,
  blogMiddleware.getPopularCategoryBlog,
  blogController.blogByCategory,
);

router.get(
  "/detail/:slug",
  blogMiddleware.getPopularBlog,
  blogMiddleware.getPopularCategoryBlog,
  blogController.detail,
);

export default router;

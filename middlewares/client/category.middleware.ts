import { NextFunction, Request, Response } from "express";
import CategoryProduct from "../../models/category-product.model";
import { buildCategoryTree } from "../../helpers/category.helper";

export const categoryMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categories = await CategoryProduct.find({
      deleted: false,
      status: "active",
    });

    const categoryTree = buildCategoryTree(categories);
    res.locals.layoutCategoryProducts = categoryTree;

    next();
  } catch (error) {
    console.error("Error in categoryMiddleware:", error);
    next();
  }
};

import { Request, Response } from "express";
import Product from "../../models/product.model";
import CategoryProduct from "../../models/category-product.model";

export const home = async (req: Request, res: Response) => {
  try {
    const categoryProductList = await CategoryProduct.find({
      deleted: false,
    });

    res.render("client/pages/home", {
      pageTitle: "Trang chủ",
      categoryProductList: categoryProductList,
    });
  } catch (error) {
    console.log(error);
  }
};

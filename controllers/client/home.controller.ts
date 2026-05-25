import { Request, Response } from "express";
import Product from "../../models/product.model";

export const home = async (req: Request, res: Response) => {
  try {
    res.render("client/pages/home", {
      pageTitle: "Trang chủ",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

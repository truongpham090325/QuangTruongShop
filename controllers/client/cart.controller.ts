import { Request, Response } from "express";

export const cart = async (req: Request, res: Response) => {
  res.render("client/pages/cart", {
    pageTitle: "Giỏ hàng",
  });
};

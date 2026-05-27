import { Request, Response } from "express";

export const checkout = async (req: Request, res: Response) => {
  res.render("client/pages/checkout", {
    pageTitle: "Đặt hàng",
  });
};

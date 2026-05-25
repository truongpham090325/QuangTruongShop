import { NextFunction, Request, Response } from "express";
import AttributeProduct from "../../models/attribute-product.model";

export const getAttributeProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const attributeList = await AttributeProduct.find({
    deleted: false,
  }).sort({
    createdAt: "desc",
  });

  res.locals.attributeList = attributeList;

  next();
};

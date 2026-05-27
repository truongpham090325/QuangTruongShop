import { Request, Response } from "express";
import Product from "../../models/product.model";

export const cart = async (req: Request, res: Response) => {
  res.render("client/pages/cart", {
    pageTitle: "Giỏ hàng",
  });
};

export const list = async (req: Request, res: Response) => {
  try {
    const { cart } = req.body;
    const cartDetail: any[] = [];

    // Lấy thông tin chi tiết sản phẩm
    if (cart && cart.length > 0) {
      for (const item of cart) {
        const productDetail = await Product.findOne({
          _id: item.productId,
          deleted: false,
          status: "active",
        });

        if (productDetail) {
          const itemDetail = {
            productId: item.productId,
            quantity: item.quantity,
            checked: item.checked !== undefined ? item.checked : true,
            detail: {
              images: productDetail.images,
              slug: productDetail.slug,
              name: productDetail.name,
              priceNew: productDetail.priceNew,
              priceOld: productDetail.priceOld,
              stock: productDetail.stock,
            },
          };

          cartDetail.push(itemDetail);
        }
      }
    }

    res.json({
      code: "success",
      message: "Thành công!",
      cart: cartDetail,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Không lấy được dữ liệu!",
    });
  }
};

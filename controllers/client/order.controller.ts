import { Request, Response } from "express";
import Order from "../../models/order.model";
import Product from "../../models/product.model";
import Coupon from "../../models/coupon.model";
import {
  generateRandomString,
  generateRandomNumber,
} from "../../helpers/generate.helper";
import { getInfoAddress } from "../../helpers/location.heloper";
import axios from "axios";

export const createPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const dataFinal: any = {};

    // Thêm code
    let code = "";
    let existCode = true;
    while (existCode) {
      code = generateRandomString(2).toUpperCase() + generateRandomNumber(6);
      const existOrderCode = await Order.findOne({
        code: code,
      });

      if (!existOrderCode) {
        existCode = false;
      }
    }
    dataFinal.code = code;

    // Thêm các trường có sẵn từ request body
    dataFinal.fullName = req.body.fullName;
    dataFinal.phone = req.body.phone;
    dataFinal.address = req.body.address;
    dataFinal.email = req.body.email;
    dataFinal.paymentMethod = req.body.paymentMethod;
    dataFinal.paymentStatus = "unpaid";
    dataFinal.orderStatus = "pending";

    // Mảng items
    dataFinal.items = [];
    for (const item of req.body.items) {
      const productDetail = await Product.findOne({
        _id: item.productId,
        deleted: false,
        status: "active",
      });

      if (productDetail) {
        // Lấy giá mới của sản phẩm (không có variants vì product schema không khai báo variants)
        const price = productDetail.priceNew || 0;

        const itemFinal = {
          productId: item.productId,
          quantity: item.quantity,
          price: price,
          image:
            productDetail.images && productDetail.images.length > 0
              ? productDetail.images[0]
              : "",
          name: productDetail.name,
        };
        dataFinal.items.push(itemFinal);
      }
    }

    // Trường subTotal
    dataFinal.subTotal = dataFinal.items.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0,
    );

    // Trường total
    dataFinal.total = dataFinal.subTotal;

    // Lưu vào CSDL
    const newRecord = new Order(dataFinal);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Đặt hàng thành công!",
      orderCode: dataFinal.code,
      phone: dataFinal.phone,
    });
  } catch (error) {
    console.error("Error in createPost order:", error);
    res.json({
      code: "error",
      message: "Có lỗi xảy ra khi đặt hàng!",
    });
  }
};

export const success = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderCode, phone } = req.query;

    if (!orderCode || !phone) {
      res.redirect("/");
      return;
    }

    const orderDetail = await Order.findOne({
      code: orderCode,
      phone: phone,
      deleted: false,
    });

    if (!orderDetail) {
      res.redirect("/");
      return;
    }

    res.render("client/pages/order-success", {
      pageTitle: "Đặt hàng thành công!",
      orderDetail: orderDetail,
      orderCode: orderCode,
      phone: phone,
    });
  } catch (error) {
    console.error("Error in success order controller:", error);
    res.redirect("/");
  }
};

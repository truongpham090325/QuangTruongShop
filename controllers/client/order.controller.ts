import { Request, Response } from "express";
import Order from "../../models/order.model";
import Product from "../../models/product.model";
import {
  generateRandomString,
  generateRandomNumber,
} from "../../helpers/generate.helper";
import axios from "axios";
import hmacSHA256 from "crypto-js/hmac-sha256";
import moment from "moment";

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

export const paymentZaloPay = async (req: Request, res: Response) => {
  const { orderCode, phone } = req.query;

  const orderDetail = await Order.findOne({
    code: orderCode,
    phone: phone,
    deleted: false,
  });

  if (!orderDetail) {
    res.redirect("/");
    return;
  }

  const config = {
    app_id: `${process.env.ZALOPAY_APPID || process.env.ZALOPAY_APP_ID}`,
    key1: `${process.env.ZALOPAY_KEY1 || process.env.ZALOPAY_APP_KEY1}`,
    key2: `${process.env.ZALOPAY_KEY2 || process.env.ZALOPAY_APP_KEY2}`,
    endpoint: `${process.env.ZALOPAY_DOMAIN}/v2/create`,
  };

  const embed_data = {
    redirecturl: `${process.env.WEBSITE_DOMAIN || process.env.DOMAIN_WEBSITE}/order/success?orderCode=${orderCode}&phone=${phone}`,
  };

  const items = [{}];
  const transID = Math.floor(Math.random() * 1000000);
  const order = {
    app_id: config.app_id,
    app_trans_id: `${moment().format("YYMMDD")}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
    app_user: `${phone}-${orderCode}`,
    app_time: Date.now(), // miliseconds
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: orderDetail.total,
    description: `Thanh toán đơn hàng ${orderCode}`,
    bank_code: "",
    mac: "",
    callback_url: `${process.env.WEBSITE_DOMAIN || process.env.DOMAIN_WEBSITE}/order/payment-zalopay-result`,
  };

  // appid|app_trans_id|appuser|amount|apptime|embeddata|item
  const data =
    config.app_id +
    "|" +
    order.app_trans_id +
    "|" +
    order.app_user +
    "|" +
    order.amount +
    "|" +
    order.app_time +
    "|" +
    order.embed_data +
    "|" +
    order.item;
  order.mac = hmacSHA256(data, config.key1).toString();

  const response = await axios.post(config.endpoint, null, { params: order });

  res.redirect(response.data.order_url);
};

export const paymentZalopayResult = async (req: Request, res: Response) => {
  const config = {
    key2: `${process.env.ZALOPAY_KEY2 || process.env.ZALOPAY_APP_KEY2}`,
  };

  let result: any = {};

  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = hmacSHA256(dataStr, config.key2).toString();

    // kiểm tra callback hợp lệ (đến từ ZaloPay server)
    if (reqMac !== mac) {
      // callback không hợp lệ
      result.return_code = -1;
      result.return_message = "mac not equal";
    } else {
      // thanh toán thành công
      // merchant cập nhật trạng thái cho đơn hàng
      let dataJson = JSON.parse(dataStr);

      // Cập nhật trạng thái đơn hàng
      const [phone, orderCode] = dataJson.app_user.split("-");
      await Order.updateOne(
        {
          phone: phone,
          code: orderCode,
          deleted: false,
        },
        {
          paymentStatus: "paid",
        },
      );

      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex: any) {
    result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
    result.return_message = ex.message;
  }

  // thông báo kết quả cho ZaloPay server
  res.json(result);
};

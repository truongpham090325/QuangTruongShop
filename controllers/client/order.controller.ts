import { Request, Response } from "express";
import Order from "../../models/order.model";
import Product from "../../models/product.model";
import { sendMail } from "../../helpers/mail.helper";
import {
  generateRandomString,
  generateRandomNumber,
} from "../../helpers/generate.helper";
import axios from "axios";
import hmacSHA256 from "crypto-js/hmac-sha256";
import moment from "moment";
import {
  getApiPayment,
  getGeneral,
} from "../../../E-commerce/configs/setting.config";

export const createPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const settingGeneral = await getGeneral();
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

    // Gửi email thông báo đặt hàng thành công
    if (dataFinal.email) {
      try {
        const mailSubject = `[Q.TruongShop] Đặt hàng thành công - Mã đơn hàng: ${dataFinal.code}`;
        const mailContent = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; color: #333333; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; border-bottom: 2px solid #81c408; padding-bottom: 15px; margin-bottom: 20px;">
              <h2 style="color: #81c408; margin: 0; font-size: 24px; text-transform: uppercase;">Đặt hàng thành công!</h2>
            </div>
            
            <p>Kính chào quý khách <strong>${dataFinal.fullName}</strong>,</p>
            <p>Cảm ơn quý khách đã tin tưởng và mua sắm tại <strong>Q.TruongShop</strong>. Đơn hàng của quý khách đã được hệ thống tiếp nhận thành công.</p>
            
            <div style="background-color: #f7f9f6; padding: 18px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #81c408;">
              <p style="margin: 6px 0; font-size: 15px;"><strong>Mã đơn hàng:</strong> <span style="color: #81c408; font-weight: bold; font-size: 16px;">${dataFinal.code}</span></p>
              <p style="margin: 6px 0; font-size: 15px;"><strong>Số điện thoại:</strong> ${dataFinal.phone}</p>
              <p style="margin: 6px 0; font-size: 15px;"><strong>Địa chỉ nhận hàng:</strong> ${dataFinal.address}</p>
              <p style="margin: 6px 0; font-size: 15px;"><strong>Phương thức thanh toán:</strong> ${
                dataFinal.paymentMethod === "money"
                  ? "Thanh toán khi nhận hàng (COD)"
                  : dataFinal.paymentMethod === "zalopay"
                    ? "Thanh toán qua ZaloPay"
                    : dataFinal.paymentMethod === "vnpay"
                      ? "Thanh toán qua VNPay"
                      : dataFinal.paymentMethod
              }</p>
            </div>

            <h3 style="color: #333333; border-bottom: 2px solid #eaeaea; padding-bottom: 8px; margin-top: 25px; font-size: 18px;">Chi tiết đơn hàng</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f2f2f2; text-align: left;">
                  <th style="padding: 12px 10px; border: 1px solid #e0e0e0; font-size: 14px;">Sản phẩm</th>
                  <th style="padding: 12px 10px; border: 1px solid #e0e0e0; text-align: center; width: 80px; font-size: 14px;">Số lượng</th>
                  <th style="padding: 12px 10px; border: 1px solid #e0e0e0; text-align: right; width: 100px; font-size: 14px;">Giá</th>
                  <th style="padding: 12px 10px; border: 1px solid #e0e0e0; text-align: right; width: 120px; font-size: 14px;">Tạm tính</th>
                </tr>
              </thead>
              <tbody>
                ${dataFinal.items
                  .map(
                    (item: any) => `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; font-size: 14px;">${item.name}</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; font-size: 14px;">${item.quantity}</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: right; font-size: 14px;">${item.price.toLocaleString("vi-VN")}đ</td>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: right; font-size: 14px;">${(item.price * item.quantity).toLocaleString("vi-VN")}đ</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 12px 10px; text-align: right; font-weight: bold; border: 1px solid #e0e0e0; font-size: 14px;">Tổng cộng:</td>
                  <td style="padding: 12px 10px; text-align: right; font-weight: bold; color: #81c408; border: 1px solid #e0e0e0; font-size: 16px;">${dataFinal.total.toLocaleString("vi-VN")}đ</td>
                </tr>
              </tfoot>
            </table>

            <p style="font-size: 15px;">Quý khách có thể kiểm tra và tra cứu trạng thái đơn hàng của mình bất cứ lúc nào bằng cách sử dụng mã đơn hàng và nhấp vào nút dưới đây:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${settingGeneral.domainWebsite || settingGeneral.domainWebsite || "http://localhost:3000"}/order/track?orderCode=${dataFinal.code}" style="background-color: #81c408; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(129, 196, 8, 0.2); font-size: 15px;">Tra cứu trạng thái đơn hàng</a>
            </div>
            
            <p style="font-size: 13px; color: #666666; text-align: center; border-top: 1px solid #eaeaea; padding-top: 15px; margin-top: 25px;">Đây là email tự động từ hệ thống Q.TruongShop. Vui lòng không trả lời trực tiếp email này.</p>
          </div>
        `;
        sendMail(dataFinal.email, mailSubject, mailContent);
      } catch (mailError) {
        console.error("Gửi email thất bại:", mailError);
      }
    }

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

  const apiPayment = await getApiPayment();
  const settingGeneral = await getGeneral();
  const config = {
    app_id: `${apiPayment.zaloPayAppId || apiPayment.zaloPayAppId}`,
    key1: `${apiPayment.zaloPayKey1 || apiPayment.zaloPayKey1}`,
    key2: `${apiPayment.zaloPayKey2 || apiPayment.zaloPayKey2}`,
    endpoint: `${apiPayment.zaloPayDomain}/v2/create`,
  };

  const embed_data = {
    redirecturl: `${settingGeneral.domainWebsite || settingGeneral.domainWebsite}/order/success?orderCode=${orderCode}&phone=${phone}`,
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
    callback_url: `${settingGeneral.domainWebsite || settingGeneral.domainWebsite}/order/payment-zalopay-result`,
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

export const track = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderCode } = req.query;
    let orderDetail = null;
    let errorMessage = null;

    if (orderCode) {
      const order = await Order.findOne({
        code: (orderCode as string).trim().toUpperCase(),
        deleted: false,
      });

      if (!order) {
        errorMessage =
          "Không tìm thấy đơn hàng với mã đã nhập. Vui lòng kiểm tra lại!";
      } else {
        // Fetch current unit and slug for each product from the Product collection
        const itemsWithDetails = [];
        for (const item of order.items) {
          const product = await Product.findOne({
            _id: item.productId,
          });

          let unit = "Kg";
          if (product && product.description) {
            const tempText = product.description.replace(/<[^>]*>/g, ""); // strip HTML tags
            const slashIndex = tempText.lastIndexOf("/");
            if (slashIndex !== -1) {
              unit = tempText.substring(slashIndex + 1).trim();
            }
          }

          itemsWithDetails.push({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            name: item.name,
            variant: item.variant,
            unit: unit,
            slug: product ? product.slug : "",
          });
        }

        const orderObj: any = order.toObject();
        orderObj.items = itemsWithDetails;
        orderObj.formattedCreatedAt = moment(order.createdAt).format(
          "DD/MM/YYYY HH:mm",
        );
        orderDetail = orderObj;
      }
    }

    // Status helpers for rendering
    const paymentStatusMap: Record<string, { text: string; class: string }> = {
      unpaid: { text: "Chưa thanh toán", class: "badge bg-warning text-dark" },
      paid: { text: "Đã thanh toán", class: "badge bg-success text-white" },
      refunded: {
        text: "Đã hoàn lại tiền",
        class: "badge bg-danger text-white",
      },
    };

    const orderStatusMap: Record<string, { text: string; class: string }> = {
      pending: { text: "Chờ xác nhận", class: "badge bg-info text-dark" },
      confirmed: { text: "Đã xác nhận", class: "badge bg-primary text-white" },
      shipping: { text: "Đang giao", class: "badge bg-warning text-dark" },
      completed: {
        text: "Giao thành công",
        class: "badge bg-success text-white",
      },
      cancelled: { text: "Hủy đơn hàng", class: "badge bg-danger text-white" },
      returned: { text: "Trả hàng", class: "badge bg-secondary text-white" },
    };

    const paymentMethodMap: Record<string, string> = {
      money: "Thanh toán khi nhận hàng (COD)",
      zalopay: "Thanh toán qua ZaloPay",
      vnpay: "Thanh toán qua VNPay",
    };

    res.render("client/pages/order-track", {
      pageTitle: "Tra cứu đơn hàng",
      orderDetail: orderDetail,
      orderCode: orderCode ? (orderCode as string).trim() : "",
      errorMessage: errorMessage,
      paymentStatusMap: paymentStatusMap,
      orderStatusMap: orderStatusMap,
      paymentMethodMap: paymentMethodMap,
    });
  } catch (error) {
    console.error("Error in track order controller:", error);
    res.redirect("/");
  }
};

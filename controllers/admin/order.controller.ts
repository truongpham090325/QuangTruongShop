import { Request, Response } from "express";
import Order from "../../models/order.model";
import { pathAdmin } from "../../configs/variable.config";

// [GET] /admin/order/list
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const find: any = {
      deleted: false,
    };

    if (req.query.keyword) {
      const keyword = `${req.query.keyword}`.trim();
      const keywordExp = new RegExp(keyword, "i");
      find.$or = [
        { code: keywordExp },
        { fullName: keywordExp },
        { phone: keywordExp },
      ];
    }

    let page = 1;
    const limitItems = 10;
    if (req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const totalRecord = await Order.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItems);
    const skip = (page - 1) * limitItems;
    const pagination = {
      totalRecord: totalRecord,
      totalPage: totalPage,
      skip: skip,
    };

    const orderList = await Order.find(find)
      .limit(limitItems)
      .skip(skip)
      .sort({
        createdAt: "desc",
      });

    // Maps for display names
    const paymentStatusMap: Record<string, string> = {
      unpaid: "Chưa thanh toán",
      paid: "Đã thanh toán",
      refunded: "Đã hoàn lại tiền",
    };

    const orderStatusMap: Record<string, string> = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao",
      completed: "Giao thành công",
      cancelled: "Đã hủy",
      returned: "Trả hàng",
    };

    const paymentMethodMap: Record<string, string> = {
      money: "Tiền mặt (COD)",
      zalopay: "ZaloPay",
      vnpay: "VNPay",
    };

    res.render("admin/pages/order-list", {
      pageTitle: "Danh sách đơn hàng",
      pagination: pagination,
      orderList: orderList,
      paymentStatusMap: paymentStatusMap,
      orderStatusMap: orderStatusMap,
      paymentMethodMap: paymentMethodMap,
    });
  } catch (error) {
    console.error("Error in list orders:", error);
    res.redirect(`/${pathAdmin}/dashboard`);
  }
};

// [GET] /admin/order/trash
export const trash = async (req: Request, res: Response): Promise<void> => {
  try {
    const find: any = {
      deleted: true,
    };

    if (req.query.keyword) {
      const keyword = `${req.query.keyword}`.trim();
      const keywordExp = new RegExp(keyword, "i");
      find.$or = [
        { code: keywordExp },
        { fullName: keywordExp },
        { phone: keywordExp },
      ];
    }

    let page = 1;
    const limitItems = 10;
    if (req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const totalRecord = await Order.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItems);
    const skip = (page - 1) * limitItems;
    const pagination = {
      totalRecord: totalRecord,
      totalPage: totalPage,
      skip: skip,
    };

    const orderList = await Order.find(find)
      .limit(limitItems)
      .skip(skip)
      .sort({
        deletedAt: "desc",
      });

    const paymentStatusMap: Record<string, string> = {
      unpaid: "Chưa thanh toán",
      paid: "Đã thanh toán",
      refunded: "Đã hoàn lại tiền",
    };

    const orderStatusMap: Record<string, string> = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao",
      completed: "Giao thành công",
      cancelled: "Đã hủy",
      returned: "Trả hàng",
    };

    const paymentMethodMap: Record<string, string> = {
      money: "Tiền mặt (COD)",
      zalopay: "ZaloPay",
      vnpay: "VNPay",
    };

    res.render("admin/pages/order-trash", {
      pageTitle: "Thùng rác đơn hàng",
      pagination: pagination,
      orderList: orderList,
      paymentStatusMap: paymentStatusMap,
      orderStatusMap: orderStatusMap,
      paymentMethodMap: paymentMethodMap,
    });
  } catch (error) {
    console.error("Error in trash orders:", error);
    res.redirect(`/${pathAdmin}/order/list`);
  }
};

// [GET] /admin/order/edit/:id
export const edit = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    const orderDetail = await Order.findOne({
      _id: id,
      deleted: false,
    });

    if (!orderDetail) {
      res.redirect(`/${pathAdmin}/order/list`);
      return;
    }

    const paymentStatusMap: Record<string, string> = {
      unpaid: "Chưa thanh toán",
      paid: "Đã thanh toán",
      refunded: "Đã hoàn lại tiền",
    };

    const orderStatusMap: Record<string, string> = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao",
      completed: "Giao thành công",
      cancelled: "Đã hủy",
      returned: "Trả hàng",
    };

    const paymentMethodMap: Record<string, string> = {
      money: "Tiền mặt (COD)",
      zalopay: "ZaloPay",
      vnpay: "VNPay",
    };

    res.render("admin/pages/order-edit", {
      pageTitle: "Chi tiết đơn hàng",
      orderDetail: orderDetail,
      paymentStatusMap: paymentStatusMap,
      orderStatusMap: orderStatusMap,
      paymentMethodMap: paymentMethodMap,
    });
  } catch (error) {
    console.error("Error in edit order:", error);
    res.redirect(`/${pathAdmin}/order/list`);
  }
};

// [PATCH] /admin/order/edit/:id
export const editPatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findOne({
      _id: id,
      deleted: false,
    });

    if (!order) {
      res.json({
        code: "error",
        message: "Đơn hàng không tồn tại!",
      });
      return;
    }

    await Order.updateOne(
      {
        _id: id,
      },
      {
        orderStatus: orderStatus,
        paymentStatus: paymentStatus,
      },
    );

    res.json({
      code: "success",
      message: "Cập nhật đơn hàng thành công!",
    });
  } catch (error) {
    console.error("Error in editPatch order:", error);
    res.json({
      code: "error",
      message: "Cập nhật đơn hàng thất bại!",
    });
  }
};

// [PATCH] /admin/order/delete/:id
export const deletePatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    const order = await Order.findOne({
      _id: id,
    });

    if (!order) {
      res.json({
        code: "error",
        message: "Đơn hàng không tồn tại!",
      });
      return;
    }

    await Order.updateOne(
      {
        _id: id,
      },
      {
        deleted: true,
        deletedAt: Date.now(),
      },
    );

    res.json({
      code: "success",
      message: "Xóa đơn hàng thành công!",
    });
  } catch (error) {
    console.error("Error in deletePatch order:", error);
    res.json({
      code: "error",
      message: "Bản ghi không hợp lệ!",
    });
  }
};

// [PATCH] /admin/order/undo/:id
export const undoPatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    const order = await Order.findOne({
      _id: id,
    });

    if (!order) {
      res.json({
        code: "error",
        message: "Đơn hàng không tồn tại!",
      });
      return;
    }

    await Order.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      },
    );

    res.json({
      code: "success",
      message: "Khôi phục đơn hàng thành công!",
    });
  } catch (error) {
    console.error("Error in undoPatch order:", error);
    res.json({
      code: "error",
      message: "Bản ghi không hợp lệ!",
    });
  }
};

// [DELETE] /admin/order/destroy/:id
export const destroyDelete = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    const order = await Order.findOne({
      _id: id,
    });

    if (!order) {
      res.json({
        code: "error",
        message: "Đơn hàng không tồn tại!",
      });
      return;
    }

    await Order.deleteOne({
      _id: id,
    });

    res.json({
      code: "success",
      message: "Đã xóa vĩnh viễn đơn hàng!",
    });
  } catch (error) {
    console.error("Error in destroyDelete order:", error);
    res.json({
      code: "error",
      message: "Bản ghi không hợp lệ!",
    });
  }
};

// [GET] /admin/order/notification-new-count
export const getNewNotificationCount = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find all new pending orders (deleted: false)
    const newOrders = await Order.find({
      orderStatus: "pending",
      deleted: false,
    })
      .sort({ createdAt: "desc" })
      .select("code fullName createdAt")
      .limit(10); // Show up to 10 recent pending orders

    const count = await Order.countDocuments({
      orderStatus: "pending",
      deleted: false,
    });

    res.json({
      code: "success",
      count: count,
      orders: newOrders,
    });
  } catch (error) {
    console.error("Error in getNewNotificationCount:", error);
    res.json({
      code: "error",
      count: 0,
      orders: [],
    });
  }
};

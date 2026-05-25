import { Request, Response } from "express";
import Coupon from "../../models/coupon.model";
import moment from "moment";
import slugify from "slugify";
import { pathAdmin } from "../../configs/variable.config";

export const create = (req: Request, res: Response) => {
  res.render("admin/pages/coupon-create", {
    pageTitle: "Tạo mã giảm giá",
  });
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const existCoupon = await Coupon.findOne({
      code: req.body.code,
      deleted: false,
    });

    if (existCoupon) {
      res.json({
        code: "error",
        message: "Mã giảm giá đã tồn tại!",
      });
      return;
    }

    req.body.value = req.body.value ? parseInt(req.body.value) : 0;
    req.body.minOrderValue = req.body.minOrderValue
      ? parseInt(req.body.minOrderValue)
      : 0;
    req.body.maxDiscountValue = req.body.maxDiscountValue
      ? parseInt(req.body.maxDiscountValue)
      : 0;
    req.body.usageLimit = req.body.usageLimit
      ? parseInt(req.body.usageLimit)
      : 0;
    req.body.startDate = req.body.startDate
      ? moment(req.body.startDate, "DD/MM/YYYY").toDate()
      : undefined;
    req.body.endDate = req.body.endDate
      ? moment(req.body.endDate, "DD/MM/YYYY").toDate()
      : undefined;

    req.body.search = slugify(`${req.body.code} ${req.body.name}`, {
      replacement: " ",
      lower: true,
    });

    const newRecord = new Coupon(req.body);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Tạo mã giảm giá thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Tạo mã giảm giá thất bại!",
    });
  }
};

export const list = async (req: Request, res: Response) => {
  const find: {
    deleted: boolean;
    search?: RegExp;
  } = {
    deleted: false,
  };

  if (req.query.keyword) {
    const keyword = slugify(`${req.query.keyword}`, {
      replacement: " ",
      lower: true, // Chữ thường
    });
    const keywordRegex = new RegExp(keyword, "i");
    find.search = keywordRegex;
  }

  // Phân trang
  const limitItems = 10;
  let page = 1;
  if (req.query.page) {
    const currentPage = parseInt(`${req.query.page}`);
    if (currentPage > 0) {
      page = currentPage;
    }
  }
  const totalRecord = await Coupon.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    skip: skip,
    totalRecord: totalRecord,
    totalPage: totalPage,
  };
  // Hết Phân trang

  const couponList: any = await Coupon.find(find)
    .limit(limitItems)
    .skip(skip)
    .sort({
      createdAt: "desc",
    });

  for (const item of couponList) {
    if (item.startDate) {
      item.startDateFormat = moment(item.startDate).format("DD/MM/YYYY");
    }
    if (item.endDate) {
      item.endDateFormat = moment(item.endDate).format("DD/MM/YYYY");
    }
  }

  res.render("admin/pages/coupon-list", {
    pageTitle: "Quản lý mã giảm giá",
    couponList: couponList,
    pagination: pagination,
  });
};

export const edit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const couponDetail: any = await Coupon.findOne({
      _id: id,
      deleted: false,
    });

    if (!couponDetail) {
      res.redirect(`/${pathAdmin}/coupon/list`);
      return;
    }

    if (couponDetail.startDate) {
      couponDetail.startDateFormat = moment(couponDetail.startDate).format(
        "DD/MM/YYYY",
      );
    }
    if (couponDetail.endDate) {
      couponDetail.endDateFormat = moment(couponDetail.endDate).format(
        "DD/MM/YYYY",
      );
    }

    res.render("admin/pages/coupon-edit", {
      pageTitle: "Chỉnh sửa mã giảm giá",
      couponDetail: couponDetail,
    });
  } catch (error) {
    res.redirect(`/${pathAdmin}/coupon/list`);
  }
};

export const editPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const couponDetail = await Coupon.findOne({
      _id: id,
      deleted: false,
    });

    if (!couponDetail) {
      res.json({
        code: "error",
        message: "Dữ liệu không hợp lệ!",
      });
      return;
    }

    const existCoupon = await Coupon.findOne({
      _id: { $ne: id },
      code: req.body.code,
      deleted: false,
    });

    if (existCoupon) {
      res.json({
        code: "error",
        message: "Mã giảm giá đã tồn tại!",
      });
      return;
    }

    req.body.value = req.body.value ? parseInt(req.body.value) : 0;
    req.body.minOrderValue = req.body.minOrderValue
      ? parseInt(req.body.minOrderValue)
      : 0;
    req.body.maxDiscountValue = req.body.maxDiscountValue
      ? parseInt(req.body.maxDiscountValue)
      : 0;
    req.body.usageLimit = req.body.usageLimit
      ? parseInt(req.body.usageLimit)
      : 0;
    req.body.startDate = req.body.startDate
      ? moment(req.body.startDate, "DD/MM/YYYY").toDate()
      : undefined;
    req.body.endDate = req.body.endDate
      ? moment(req.body.endDate, "DD/MM/YYYY").toDate()
      : undefined;

    req.body.search = slugify(`${req.body.code} ${req.body.name}`, {
      replacement: " ",
      lower: true,
    });

    await Coupon.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body,
    );

    res.json({
      code: "success",
      message: "Cập nhập mã giảm giá thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Tạo mã giảm giá thất bại!",
    });
  }
};

export const deletePatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const couponDetail = await Coupon.findOne({
      _id: id,
    });

    if (!couponDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Coupon.updateOne(
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
      message: "Xóa mã giảm giá thành công!",
    });
    return;
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Bản ghi không hợp lệ!",
    });
  }
};

export const trash = async (req: Request, res: Response) => {
  const find: {
    deleted: boolean;
    search?: RegExp;
  } = {
    deleted: true,
  };

  const couponList: any = await Coupon.find(find);

  res.render("admin/pages/coupon-trash", {
    pageTitle: "Thùng rác mã giảm giá",
    couponList: couponList,
  });
};

export const undoPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const couponDetail = await Coupon.findOne({
      _id: id,
      deleted: true,
    });

    if (!couponDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Coupon.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      },
    );

    res.json({
      code: "success",
      message: "Khôi phục mã giảm giá thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Bản ghi không hợp lệ!",
    });
  }
};

export const destroyDelete = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const couponDetail = await Coupon.findOne({
      _id: id,
    });

    if (!couponDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Coupon.deleteOne({
      _id: id,
    });

    res.json({
      code: "success",
      message: "Đã xóa vĩnh viễn mã giảm giá!",
    });
    return;
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Bản ghi không hợp lệ!",
    });
  }
};

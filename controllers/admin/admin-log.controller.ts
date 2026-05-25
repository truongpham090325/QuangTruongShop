import { Request, Response } from "express";
import AdminLog from "../../models/admin-log.model";
import AccountAdmin from "../../models/account-admin.model";
import moment from "moment";

export const list = async (req: Request, res: Response) => {
  const find: {
    deleted: boolean;
  } = {
    deleted: false,
  };

  let page = 1;
  const limitItems = 10;
  if (req.query.page && parseInt(`${req.query.page}`) > 0) {
    page = parseInt(`${req.query.page}`);
  }
  const totalRecord = await AdminLog.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    totalRecord: totalRecord,
    totalPage: totalPage,
    skip: skip,
  };

  const adminLogList: any = await AdminLog.find(find)
    .limit(limitItems)
    .skip(skip)
    .sort({
      createdAt: "desc",
    });

  for (const item of adminLogList) {
    let adminName = "Super Admin";

    if (item.adminId && item.adminId.length === 24) {
      const adminInfo: any = await AccountAdmin.findOne({
        _id: item.adminId,
      });

      if (adminInfo) {
        adminName = adminInfo.fullName;
      }
    }

    item.adminName = adminName;

    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
  }

  res.render("admin/pages/admin-log-list", {
    pageTitle: "Lịch sử hoạt động",
    pagination: pagination,
    adminLogList: adminLogList,
  });
};

export const deletePatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const blogDetail = await AdminLog.findOne({
      _id: id,
      deleted: false,
    });

    if (!blogDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await AdminLog.updateOne(
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
      message: "Xóa lịch sử thành công!",
    });
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
  } = {
    deleted: true,
  };

  const adminLogList: any = await AdminLog.find(find).sort({
    createdAt: "desc",
  });

  for (const item of adminLogList) {
    let adminName = "Super Admin";

    if (item.adminId && item.adminId.length === 24) {
      const adminInfo: any = await AccountAdmin.findOne({
        _id: item.adminId,
      });

      if (adminInfo) {
        adminName = adminInfo.fullName;
      }
    }

    item.adminName = adminName;

    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
  }

  res.render("admin/pages/admin-log-trash", {
    pageTitle: "Lịch sử hoạt động",
    adminLogList: adminLogList,
  });
};

export const undoPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const adminLogDetail = await AdminLog.findOne({
      _id: id,
      deleted: true,
    });

    if (!adminLogDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await AdminLog.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      },
    );

    res.json({
      code: "success",
      message: "Khôi phục lịch sử thành công!",
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

    const adminLogDetail = await AdminLog.findOne({
      _id: id,
    });

    if (!adminLogDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await AdminLog.deleteOne({
      _id: id,
    });

    res.json({
      code: "success",
      message: "Đã xóa vĩnh viễn lịch sử hoạt động!",
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

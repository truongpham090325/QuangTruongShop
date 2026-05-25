import { Request, Response } from "express";
import slugify from "slugify";
import AccountUser from "../../models/account-user.model";

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
      lower: true,
    });

    const keywordExp = new RegExp(keyword, "i");
    find.search = keywordExp;
  }

  // Phân trang
  let page = 1;
  const limitItems = 10;
  if (req.query.page && parseInt(`${req.query.page}`) > 0) {
    page = parseInt(`${req.query.page}`);
  }
  const totalRecord = await AccountUser.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    totalRecord: totalRecord,
    totalPage: totalPage,
    skip: skip,
  };
  // Hết phân trang

  const accountUserList: any = await AccountUser.find(find)
    .limit(limitItems)
    .skip(skip)
    .sort({
      createdAt: "desc",
    });

  res.render("admin/pages/account-user-list", {
    pageTitle: "Danh sách tài khoản người dùng",
    accountUserList: accountUserList,
    pagination: pagination,
  });
};

export const deletePatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const accountDetail = await AccountUser.findOne({
      _id: id,
      deleted: false,
    });

    if (!accountDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await AccountUser.updateOne(
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
      message: "Xóa tài khoản thành công!",
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
    search?: RegExp;
  } = {
    deleted: true,
  };

  const accountUserList: any = await AccountUser.find(find);

  res.render("admin/pages/account-user-trash", {
    pageTitle: "Thùng rác tài khoản người dùng",
    accountUserList: accountUserList,
  });
};

export const undoPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const accountDetail = await AccountUser.findOne({
      _id: id,
      deleted: true,
    });

    if (!accountDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await AccountUser.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      },
    );

    res.json({
      code: "success",
      message: "Khôi phục tài khoản thành công!",
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

    const accountDetail = await AccountUser.findOne({
      _id: id,
    });

    if (!accountDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await AccountUser.deleteOne({
      _id: id,
    });

    res.json({
      code: "success",
      message: "Đã xóa vĩnh viễn tài khoản!",
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

import { Request, Response } from "express";
import Role from "../../models/role.model";
import AccountAdmin from "../../models/account-admin.model";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { pathAdmin } from "../../configs/variable.config";

export const create = async (req: Request, res: Response) => {
  const roleList = await Role.find({
    deleted: false,
    status: "active",
  });

  res.render("admin/pages/account-admin-create", {
    pageTitle: "Tạo tài khoản quản trị",
    roleList: roleList,
  });
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const existAccount = await AccountAdmin.findOne({
      email: req.body.email,
    });

    if (existAccount) {
      res.json({
        code: "error",
        message: "Email đã tồn tại!",
      });
      return;
    }

    // Mã hóa mật khẩu
    req.body.password = await bcrypt.hash(req.body.password, 10);

    req.body.roles = JSON.parse(req.body.roles);

    req.body.search = slugify(`${req.body.fullName} ${req.body.email}`, {
      replacement: " ",
      lower: true,
    });

    const newRecord = new AccountAdmin(req.body);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Tạo tài khoản thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
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
  const totalRecord = await AccountAdmin.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    totalRecord: totalRecord,
    totalPage: totalPage,
    skip: skip,
  };
  // Hết phân trang

  const accountAdminList: any = await AccountAdmin.find(find)
    .limit(limitItems)
    .skip(skip)
    .sort({
      createdAt: "desc",
    });

  for (const item of accountAdminList) {
    const roleList = await Role.find({
      _id: { $in: item.roles },
    });

    item.rolesName = roleList.map((item) => item.name);
  }

  res.render("admin/pages/account-admin-list", {
    pageTitle: "Danh sách tài khoản quản trị",
    accountAdminList: accountAdminList,
    pagination: pagination,
  });
};

export const edit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const accountDetail = await AccountAdmin.findOne({
      _id: id,
    });

    if (!accountDetail) {
      res.redirect(`/${pathAdmin}/account-admin/list`);
      return;
    }

    const roleList = await Role.find({
      deleted: false,
      status: "active",
    });

    res.render("admin/pages/account-admin-edit", {
      pageTitle: "Chỉnh sửa tài khoản quản trị",
      roleList: roleList,
      accountDetail: accountDetail,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/${pathAdmin}/account-admin/list`);
  }
};

export const editPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const accountDetail = await AccountAdmin.findOne({
      _id: id,
      deleted: false,
    });

    if (!accountDetail) {
      res.json({
        code: "error",
        message: "Tài khoản không tồn tại!",
      });
      return;
    }

    const existAccount = await AccountAdmin.findOne({
      _id: { $ne: id }, // not equal - không bằng
      email: req.body.email,
    });

    if (existAccount) {
      res.json({
        code: "error",
        message: "Email đã được sử dụng bởi tài khoản khác!",
      });
      return;
    }

    req.body.roles = JSON.parse(req.body.roles);

    req.body.search = slugify(`${req.body.fullName} ${req.body.email}`, {
      replacement: " ",
      lower: true,
    });

    await AccountAdmin.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body,
    );

    res.json({
      code: "success",
      message: "Cập nhập tài khoản thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const deletePatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const accountDetail = await AccountAdmin.findOne({
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

    await AccountAdmin.updateOne(
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

  const accountAdminList: any = await AccountAdmin.find(find);

  for (const item of accountAdminList) {
    const roleList = await Role.find({
      _id: { $in: item.roles },
    });

    item.rolesName = roleList.map((item) => item.name);
  }

  res.render("admin/pages/account-admin-trash", {
    pageTitle: "Thùng rác tài khoản quản trị",
    accountAdminList: accountAdminList,
  });
};

export const undoPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const accountDetail = await AccountAdmin.findOne({
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

    await AccountAdmin.updateOne(
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

    const accountDetail = await AccountAdmin.findOne({
      _id: id,
    });

    if (!accountDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await AccountAdmin.deleteOne({
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

export const changePassword = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const accountDetail = await AccountAdmin.findOne({
      _id: id,
    });

    if (!accountDetail) {
      res.redirect(`/${pathAdmin}/account-admin/list`);
      return;
    }

    res.render("admin/pages/account-admin-change-password", {
      pageTitle: "Đổi mật khâu tài khoản quản trị",
      accountDetail: accountDetail,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/${pathAdmin}/account-admin/list`);
  }
};

export const changePasswordPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const accountDetail = await AccountAdmin.findOne({
      _id: id,
    });

    if (!accountDetail) {
      res.json({
        code: "error",
        message: "Tài khoản không tồn tại!",
      });
      return;
    }

    // Mã hóa mật khẩu
    req.body.password = await bcrypt.hash(req.body.password, 10);

    await AccountAdmin.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body,
    );

    res.json({
      code: "success",
      message: "Đổi mật khâu tài khoản quản trị thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

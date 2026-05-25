import { Request, Response } from "express";
import { pathAdmin, permissionList } from "../../configs/variable.config";
import Role from "../../models/role.model";
import slugify from "slugify";

export const create = (req: Request, res: Response) => {
  res.render("admin/pages/role-create", {
    pageTitle: "Tạo nhóm quyền",
    permissionList: permissionList,
  });
};

export const createPost = async (req: Request, res: Response) => {
  try {
    req.body.permissions = JSON.parse(req.body.permissions);

    req.body.search = slugify(`${req.body.name}`, {
      replacement: " ",
      lower: true,
    });

    const newRecord = new Role(req.body);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Tạo nhóm quyền thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Không thể tạo nhóm quyền!",
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

  let page = 1;
  const limitItems = 10;
  if (req.query.page && parseInt(`${req.query.page}`) > 0) {
    page = parseInt(`${req.query.page}`);
  }
  const totalRecord = await Role.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    totalRecord: totalRecord,
    totalPage: totalPage,
    skip: skip,
  };

  const roleList: any = await Role.find(find).limit(limitItems).skip(skip);

  res.render("admin/pages/role-list", {
    pageTitle: "Danh sách nhóm quyền",
    roleList: roleList,
    pagination: pagination,
  });
};

export const edit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const roleDetail = await Role.findOne({
      _id: id,
    });
    if (!roleDetail) {
      res.redirect(`/${pathAdmin}/role/list`);
      return;
    }

    res.render("admin/pages/role-edit", {
      pageTitle: "Chỉnh sửa nhóm quyền",
      roleDetail: roleDetail,
      permissionList: permissionList,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/${pathAdmin}/role/list`);
  }
};

export const editPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const blogDetail = await Role.findOne({
      _id: id,
    });

    if (!blogDetail) {
      res.json({
        code: "error",
        message: "Cập nhập nhóm quyền thất bại!",
      });
      return;
    }

    req.body.permissions = JSON.parse(req.body.permissions);

    req.body.search = slugify(`${req.body.name}`, {
      replacement: " ",
      lower: true,
    });

    await Role.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body,
    );

    res.json({
      code: "success",
      message: "Cập nhập nhóm quyền thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Cập nhập danh mục bài viết thất bại!",
    });
  }
};

export const deletePatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const roleDetail = await Role.findOne({
      _id: id,
      deleted: false,
    });

    if (!roleDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Role.updateOne(
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
      message: "Xóa nhóm quyền thành công!",
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

  const roleList: any = await Role.find(find);

  res.render("admin/pages/role-trash", {
    pageTitle: "Thùng rác nhóm quyền",
    roleList: roleList,
  });
};

export const undoPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const roleDetail = await Role.findOne({
      _id: id,
      deleted: true,
    });

    if (!roleDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Role.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      },
    );

    res.json({
      code: "success",
      message: "Khôi phục nhóm quyền thành công!",
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

    const roleDetail = await Role.findOne({
      _id: id,
    });

    if (!roleDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Role.deleteOne({
      _id: id,
    });

    res.json({
      code: "success",
      message: "Đã xóa vĩnh viễn nhóm quyền!",
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

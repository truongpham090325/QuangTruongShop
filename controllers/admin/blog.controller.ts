import { Request, Response } from "express";
import CategoryBlog from "../../models/category-blog.model";
import { buildCategoryTree } from "../../helpers/category.helper";
import slugify from "slugify";
import { pathAdmin } from "../../configs/variable.config";
import Blog from "../../models/blog.model";
import { logAdminAction } from "../../helpers/log.helper";
import { RequestAccount } from "../../interfaces/request.interface";

export const category = async (req: Request, res: Response) => {
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
  const totalRecord = await CategoryBlog.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    totalRecord: totalRecord,
    totalPage: totalPage,
    skip: skip,
  };

  const categoryList: any = await CategoryBlog.find(find)
    .limit(limitItems)
    .skip(skip);

  for (const item of categoryList) {
    if (item.parent) {
      const categoryParent = await CategoryBlog.findOne({
        _id: item.parent,
      });

      item.parentName = categoryParent?.name;
    }
  }

  res.render("admin/pages/blog-category", {
    pageTitle: "Quản lý danh mục bài viết",
    categoryList: categoryList,
    pagination: pagination,
  });
};

export const createCategory = async (req: Request, res: Response) => {
  const categoryList = await CategoryBlog.find({
    deleted: false,
  });

  const categoryTree = buildCategoryTree(categoryList);

  res.render("admin/pages/blog-create-category", {
    pageTitle: "Tạo danh mục bài viết",
    categoryList: categoryTree,
  });
};

export const createCategoryPost = async (req: Request, res: Response) => {
  try {
    const existSlug = await CategoryBlog.findOne({
      slug: req.body.slug,
    });
    if (existSlug) {
      res.json({
        code: "error",
        message: "Đường dẫn đã tồn tại!",
      });
      return;
    }

    req.body.search = slugify(`${req.body.name}`, {
      replacement: " ",
      lower: true,
    });

    const newRecord = new CategoryBlog(req.body);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Tạo danh mục bài viết thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "success",
      message: "Tạo danh mục bài viết thất bại!",
    });
  }
};

export const editCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const categoryDetail = await CategoryBlog.findOne({
      _id: id,
    });
    if (!categoryDetail) {
      res.redirect(`/${pathAdmin}/blog/category`);
      return;
    }

    const categoryList = await CategoryBlog.find({
      deleted: false,
    });

    const categoryTree = buildCategoryTree(categoryList);

    res.render("admin/pages/blog-edit-category", {
      pageTitle: "Chỉnh sửa danh mục bài viết",
      categoryList: categoryTree,
      categoryDetail: categoryDetail,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/${pathAdmin}/blog/category`);
  }
};

export const editCategoryPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const categoryDetail = await CategoryBlog.findOne({
      _id: id,
    });

    if (!categoryDetail) {
      res.json({
        code: "error",
        message: "Cập nhập danh mục bài viết thất bại!",
      });
      return;
    }

    const existSlug = await CategoryBlog.findOne({
      _id: { $ne: id },
      slug: req.body.slug,
    });
    if (existSlug) {
      res.json({
        code: "error",
        message: "Đường dẫn đã tồn tại!",
      });
      return;
    }

    req.body.search = slugify(`${req.body.name}`, {
      replacement: " ",
      lower: true,
    });

    await CategoryBlog.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body,
    );

    res.json({
      code: "success",
      message: "Cập nhập danh mục bài viết thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "success",
      message: "Cập nhập danh mục bài viết thất bại!",
    });
  }
};

export const deleteCategoryPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const categoryDetail = await CategoryBlog.findOne({
      _id: id,
    });

    if (!categoryDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await CategoryBlog.updateOne(
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
      message: "Xóa danh mục bài viết thành công!",
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

export const trashCategory = async (req: Request, res: Response) => {
  const categoryList: any = await CategoryBlog.find({
    deleted: true,
  });

  for (const item of categoryList) {
    if (item.parent) {
      const categoryParent = await CategoryBlog.findOne({
        _id: item.parent,
      });

      item.parentName = categoryParent?.name;
    }
  }

  res.render("admin/pages/blog-trash-category", {
    pageTitle: "Thùng rác danh mục bài viết",
    categoryList: categoryList,
  });
};

export const undoCategoryPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const categoryDetail = await CategoryBlog.findOne({
      _id: id,
    });

    if (!categoryDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await CategoryBlog.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      },
    );

    res.json({
      code: "success",
      message: "Khôi phục danh mục bài viết thành công!",
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

export const destroyCategoryDelete = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const categoryDetail = await CategoryBlog.findOne({
      _id: id,
    });

    if (!categoryDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await CategoryBlog.deleteOne({
      _id: id,
    });

    res.json({
      code: "success",
      message: "Đã xóa vĩnh viễn danh mục bài viết!",
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

export const create = async (req: Request, res: Response) => {
  const categoryList = await CategoryBlog.find({
    deleted: false,
  });

  const categoryTree = buildCategoryTree(categoryList);

  res.render("admin/pages/blog-create", {
    pageTitle: "Tạo bài viết",
    categoryList: categoryTree,
  });
};

export const createPost = async (req: RequestAccount, res: Response) => {
  try {
    const existSlug = await Blog.findOne({
      slug: req.body.slug,
    });
    if (existSlug) {
      res.json({
        code: "error",
        message: "Đường dẫn đã tồn tại!",
      });
      return;
    }

    req.body.category = JSON.parse(req.body.category);

    if (req.body.status == "published") {
      req.body.publishAt = new Date();
    }

    req.body.search = slugify(`${req.body.name}`, {
      replacement: " ",
      lower: true,
    });

    req.body.createdBy = req.adminId;

    const newRecord = new Blog(req.body);
    await newRecord.save();

    logAdminAction(
      req,
      `Đã tạo bài viết: ${req.body.name} (Id: ${newRecord.id})`,
    );

    res.json({
      code: "success",
      message: "Tạo bài viết thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "success",
      message: "Tạo bài viết thất bại!",
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
  const totalRecord = await Blog.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    totalRecord: totalRecord,
    totalPage: totalPage,
    skip: skip,
  };

  const blogList: any = await Blog.find(find).limit(limitItems).skip(skip);

  res.render("admin/pages/blog-list", {
    pageTitle: "Danh sách bài viết",
    blogList: blogList,
    pagination: pagination,
  });
};

export const edit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const blogDetail = await Blog.findOne({
      _id: id,
    });
    if (!blogDetail) {
      res.redirect(`/${pathAdmin}/blog/list`);
      return;
    }

    const categoryList = await CategoryBlog.find({
      deleted: false,
    });

    const categoryTree = buildCategoryTree(categoryList);

    res.render("admin/pages/blog-edit", {
      pageTitle: "Chỉnh sửa bài viết",
      blogDetail: blogDetail,
      categoryList: categoryTree,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/${pathAdmin}/blog/list`);
  }
};

export const editPatch = async (req: RequestAccount, res: Response) => {
  try {
    const id = req.params.id;

    const blogDetail = await Blog.findOne({
      _id: id,
    });

    if (!blogDetail) {
      res.json({
        code: "error",
        message: "Cập nhập danh mục bài viết thất bại!",
      });
      return;
    }

    const existSlug = await Blog.findOne({
      _id: { $ne: id },
      slug: req.body.slug,
    });
    if (existSlug) {
      res.json({
        code: "error",
        message: "Đường dẫn đã tồn tại!",
      });
      return;
    }

    req.body.category = JSON.parse(req.body.category);

    if (req.body.status == "published") {
      req.body.publishAt = new Date();
    }

    req.body.search = slugify(`${req.body.name}`, {
      replacement: " ",
      lower: true,
    });

    req.body.updatedBy = req.adminId;

    await Blog.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body,
    );

    res.json({
      code: "success",
      message: "Cập nhập bài viết thành công!",
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

    const blogDetail = await Blog.findOne({
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

    await Blog.updateOne(
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
      message: "Xóa bài viết thành công!",
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

  const blogList: any = await Blog.find(find);

  res.render("admin/pages/blog-trash", {
    pageTitle: "Thùng rác bài viết",
    blogList: blogList,
  });
};

export const undoPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const blogDetail = await Blog.findOne({
      _id: id,
      deleted: true,
    });

    if (!blogDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Blog.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      },
    );

    res.json({
      code: "success",
      message: "Khôi phục bài viết thành công!",
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

    const blogDetail = await Blog.findOne({
      _id: id,
    });

    if (!blogDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Blog.deleteOne({
      _id: id,
    });

    res.json({
      code: "success",
      message: "Đã xóa vĩnh viễn bài viết!",
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

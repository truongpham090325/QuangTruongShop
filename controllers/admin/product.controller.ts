import { Request, Response } from "express";
import CategoryProduct from "../../models/category-product.model";
import { buildCategoryTree } from "../../helpers/category.helper";
import slugify from "slugify";
import { pathAdmin } from "../../configs/variable.config";
import Product from "../../models/product.model";
import Warehouse from "../../models/warehouse.model";
import { Parser } from "json2csv";
import Papa from "papaparse";
import { generateRandomString } from "../../helpers/generate.helper";

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
  const totalRecord = await CategoryProduct.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    totalRecord: totalRecord,
    totalPage: totalPage,
    skip: skip,
  };

  const categoryList: any = await CategoryProduct.find(find)
    .limit(limitItems)
    .skip(skip)
    .sort({
      createdAt: "desc",
    });

  for (const item of categoryList) {
    if (item.parent) {
      const categoryParent = await CategoryProduct.findOne({
        _id: item.parent,
      });

      item.parentName = categoryParent?.name;
    }
  }

  res.render("admin/pages/product-category", {
    pageTitle: "Quản lý danh mục sản phẩm",
    categoryList: categoryList,
    pagination: pagination,
  });
};

export const createCategory = async (req: Request, res: Response) => {
  const categoryList = await CategoryProduct.find({});
  const categoryTree = buildCategoryTree(categoryList);

  res.render("admin/pages/product-create-category", {
    pageTitle: "Tạo danh mục sản phẩm",
    categoryList: categoryTree,
  });
};

export const createCategoryPost = async (req: Request, res: Response) => {
  try {
    const existSlug = await CategoryProduct.findOne({
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

    const newRecord = new CategoryProduct(req.body);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Tạo danh mục sản phẩm thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "success",
      message: "Tạo danh mục sản phẩm thất bại!",
    });
  }
};

export const editCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const categoryDetail = await CategoryProduct.findOne({
      _id: id,
      deleted: false,
    });

    if (!categoryDetail) {
      res.redirect(`/${pathAdmin}/product/category`);
      return;
    }
    const categoryList = await CategoryProduct.find({
      deleted: false,
    });
    const categoryTree = buildCategoryTree(categoryList);

    res.render("admin/pages/product-edit-category", {
      pageTitle: "Chỉnh sửa danh mục sản phẩm",
      categoryList: categoryTree,
      categoryDetail: categoryDetail,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/${pathAdmin}/product/category`);
  }
};

export const editCategoryPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const categoryDetail = await CategoryProduct.findOne({
      _id: id,
    });

    if (!categoryDetail) {
      res.json({
        code: "error",
        message: "Cập nhập danh mục sản phẩm thất bại!",
      });
      return;
    }

    const existSlug = await CategoryProduct.findOne({
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

    await CategoryProduct.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body,
    );

    res.json({
      code: "success",
      message: "Cập nhập danh mục sản phẩm thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "success",
      message: "Cập nhập danh mục sản phẩm thất bại!",
    });
  }
};

export const deleteCategoryPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const categoryDetail = await CategoryProduct.findOne({
      _id: id,
    });

    if (!categoryDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await CategoryProduct.updateOne(
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
      message: "Xóa danh mục sản phẩm thành công!",
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
  const categoryList: any = await CategoryProduct.find({
    deleted: true,
  });

  for (const item of categoryList) {
    if (item.parent) {
      const categoryParent = await CategoryProduct.findOne({
        _id: item.parent,
      });

      item.parentName = categoryParent?.name;
    }
  }

  res.render("admin/pages/product-trash-category", {
    pageTitle: "Thùng rác danh mục sản phẩm",
    categoryList: categoryList,
  });
};

export const undoCategoryPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const categoryDetail = await CategoryProduct.findOne({
      _id: id,
    });

    if (!categoryDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await CategoryProduct.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      },
    );

    res.json({
      code: "success",
      message: "Khôi phục danh mục sản phẩm thành công!",
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

    const categoryDetail = await CategoryProduct.findOne({
      _id: id,
    });

    if (!categoryDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await CategoryProduct.deleteOne({
      _id: id,
    });

    res.json({
      code: "success",
      message: "Đã xóa vĩnh viễn danh mục sản phẩm!",
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
  const categoryList = await CategoryProduct.find({
    deleted: false,
  });

  const categoryTree = buildCategoryTree(categoryList);

  // Danh sách sản phẩm
  const productList = await Product.find({
    deleted: false,
    status: "active",
  })
    .sort({
      position: "desc",
    })
    .select("id name")
    .lean();
  // Hết Danh sách sản phẩm

  // Danh sách kho hàng
  const warehouses = await Warehouse.find({ deleted: false }).select("id name code");

  res.render("admin/pages/product-create", {
    pageTitle: "Tạo sản phẩm",
    categoryList: categoryTree,
    productList: productList,
    warehouses: warehouses,
  });
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const existSlug = await Product.findOne({
      slug: req.body.slug,
    });
    if (existSlug) {
      res.json({
        code: "error",
        message: "Đường dẫn đã tồn tại!",
      });
      return;
    }

    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      // Nếu không truyền position thì lấy position lớn nhất + 1
      const recordMaxPosition = await Product.findOne({}).sort({
        position: "desc",
      });

      if (recordMaxPosition && recordMaxPosition.position) {
        req.body.position = recordMaxPosition.position + 1;
      } else {
        req.body.position = 1;
      }
    }

    if (req.body.priceOld) {
      req.body.priceOld = parseInt(req.body.priceOld);
    }

    if (req.body.priceNew) {
      req.body.priceNew = parseInt(req.body.priceNew);
      req.body.discount = Math.floor(
        ((req.body.priceOld - req.body.priceNew) / req.body.priceOld) * 100,
      );
    } else {
      req.body.priceNew = parseInt(req.body.priceOld);
      req.body.discount = 0;
    }

    let totalStock = 0;
    let warehouseStocksObj: any = {};
    if (req.body.warehouseStocks) {
      warehouseStocksObj = JSON.parse(req.body.warehouseStocks);
      for (const key in warehouseStocksObj) {
        totalStock += parseInt(warehouseStocksObj[key]) || 0;
      }
      req.body.stock = totalStock;
    } else if (req.body.stock) {
      req.body.stock = parseInt(req.body.stock);
    } else {
      req.body.stock = 0;
    }

    req.body.category = JSON.parse(req.body.category);

    req.body.images = JSON.parse(req.body.images);

    req.body.search = slugify(`${req.body.name}`, {
      replacement: " ",
      lower: true,
    });

    const newRecord = new Product(req.body);
    await newRecord.save();

    // Lưu kho hàng
    if (req.body.warehouseStocks) {
      const warehouses = await Warehouse.find({ deleted: false });
      for (const w of warehouses) {
        const stockVal = parseInt(warehouseStocksObj[w.id]) || 0;
        const prodIdx = w.products.findIndex((p: any) => p.productId.toString() === newRecord.id.toString());
        if (prodIdx > -1) {
          w.products[prodIdx].stock = stockVal;
        } else {
          w.products.push({
            productId: newRecord._id,
            stock: stockVal,
          });
        }
        await w.save();
      }
    }

    res.json({
      code: "success",
      message: "Tạo sản phẩm thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Tạo sản phẩm thất bại!",
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
  const totalRecord = await Product.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    totalRecord: totalRecord,
    totalPage: totalPage,
    skip: skip,
  };

  const productList = await Product.find(find)
    .limit(limitItems)
    .skip(skip)
    .sort({
      createdAt: "desc",
    });

  res.render("admin/pages/product-list", {
    pageTitle: "Danh sách sản phẩm",
    pagination: pagination,
    productList: productList,
  });
};

export const edit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const productDetail = await Product.findOne({
      _id: id,
    });

    if (!productDetail) {
      res.redirect(`/${pathAdmin}/product/list`);
      return;
    }

    const categoryList = await CategoryProduct.find({
      deleted: false,
    });
    const categoryTree = buildCategoryTree(categoryList);

    const attributeNameList: string[] = [];

    // Danh sách sản phẩm
    const productList = await Product.find({
      _id: { $ne: productDetail.id },
      deleted: false,
      status: "active",
    })
      .sort({
        position: "desc",
      })
      .select("id name")
      .lean();
    // Hết Danh sách sản phẩm

    // Danh sách kho hàng và số lượng tồn của sản phẩm này trong các kho
    const warehouses = await Warehouse.find({ deleted: false }).select("id name code products");
    const warehouseStocks: any = {};
    for (const w of warehouses) {
      const item = w.products.find((p: any) => p.productId.toString() === productDetail.id.toString());
      warehouseStocks[w.id] = item ? (item.stock || 0) : 0;
    }

    res.render("admin/pages/product-edit", {
      pageTitle: "Chỉnh sửa sản phẩm",
      productDetail: productDetail,
      categoryList: categoryTree,
      attributeNameList: attributeNameList,
      productList: productList,
      warehouses: warehouses,
      warehouseStocks: warehouseStocks,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/${pathAdmin}/product/list`);
  }
};

export const editPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const productDetail = await Product.findOne({
      _id: id,
      deleted: false,
    });

    if (!productDetail) {
      res.json({
        code: "error",
        message: "Dữ liệu không hợp lệ!",
      });
      return;
    }

    const existSlug = await Product.findOne({
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

    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      // Nếu không truyền position thì lấy position lớn nhất + 1
      const recordMaxPosition = await Product.findOne({}).sort({
        position: "desc",
      });

      if (recordMaxPosition && recordMaxPosition.position) {
        req.body.position = recordMaxPosition.position + 1;
      } else {
        req.body.position = 1;
      }
    }

    if (req.body.priceOld) {
      req.body.priceOld = parseInt(req.body.priceOld);
    }

    if (req.body.priceNew) {
      req.body.priceNew = parseInt(req.body.priceNew);
      req.body.discount = Math.floor(
        ((req.body.priceOld - req.body.priceNew) / req.body.priceOld) * 100,
      );
    } else {
      req.body.priceNew = parseInt(req.body.priceOld);
      req.body.discount = 0;
    }

    let totalStock = 0;
    let warehouseStocksObj: any = {};
    if (req.body.warehouseStocks) {
      warehouseStocksObj = JSON.parse(req.body.warehouseStocks);
      for (const key in warehouseStocksObj) {
        totalStock += parseInt(warehouseStocksObj[key]) || 0;
      }
      req.body.stock = totalStock;
    } else if (req.body.stock) {
      req.body.stock = parseInt(req.body.stock);
    } else {
      req.body.stock = 0;
    }

    req.body.category = JSON.parse(req.body.category);

    req.body.images = JSON.parse(req.body.images);

    req.body.search = slugify(`${req.body.name}`, {
      replacement: " ",
      lower: true,
    });

    await Product.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body,
    );

    // Cập nhật kho hàng
    if (req.body.warehouseStocks) {
      const warehouses = await Warehouse.find({ deleted: false });
      for (const w of warehouses) {
        const stockVal = parseInt(warehouseStocksObj[w.id]) || 0;
        const prodIdx = w.products.findIndex((p: any) => p.productId.toString() === id.toString());
        if (prodIdx > -1) {
          w.products[prodIdx].stock = stockVal;
        } else {
          w.products.push({
            productId: id,
            stock: stockVal,
          });
        }
        await w.save();
      }
    }

    res.json({
      code: "success",
      message: "Cập nhập sản phẩm thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Cập nhập sản phẩm thất bại!",
    });
  }
};

export const deletePatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const productDetail = await Product.findOne({
      _id: id,
    });

    if (!productDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Product.updateOne(
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
      message: "Xóa sản phẩm thành công!",
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
  const productList: any = await Product.find({
    deleted: true,
  });

  res.render("admin/pages/product-trash", {
    pageTitle: "Thùng rác sản phẩm",
    productList: productList,
  });
};

export const undoPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const productDetail = await Product.findOne({
      _id: id,
    });

    if (!productDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Product.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      },
    );

    res.json({
      code: "success",
      message: "Khôi phục sản phẩm thành công!",
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

export const destroyDelete = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const productDetail = await Product.findOne({
      _id: id,
    });

    if (!productDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    await Product.deleteOne({
      _id: id,
    });

    res.json({
      code: "success",
      message: "Đã xóa vĩnh viễn sản phẩm!",
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

export const exportCSV = async (req: Request, res: Response) => {
  try {
    const productList = await Product.find().lean();

    // Chuyển JSON sang CSV
    const parser = new Parser();
    let csv = parser.parse(productList);

    // Sửa lỗi tiếng việt
    csv = "\ufeff" + csv;

    res.header("Content-Type", "text/csv");
    res.attachment("products.csv");

    res.send(csv);
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Lỗi Export!",
    });
  }
};

export const importCSVPost = async (req: Request, res: Response) => {
  try {
    // Chuyển file CSV sang JSON
    const result = Papa.parse(`${req.file?.buffer}`, {
      header: true,
      skipEmptyLines: true,
    });

    const items: any[] = result.data;

    for (const item of items) {
      item.position = item.position ? parseInt(item.position) : 0;
      item.category = item.category ? JSON.parse(item.category) : [];
      item.priceOld = item.priceOld ? parseInt(item.priceOld) : 0;
      item.priceNew = item.priceNew ? parseInt(item.priceNew) : 0;
      item.stock = item.stock ? parseInt(item.stock) : 0;
      item.attributes = item.attributes ? JSON.parse(item.attributes) : [];
      item.variants = item.variants ? JSON.parse(item.variants) : [];
      item.images = item.images ? JSON.parse(item.images) : [];
      item.view = item.view ? parseInt(item.view) : 0;
      item.tags = item.tags ? JSON.parse(item.tags) : [];
      item.deleted = item.deleted == "true" ? true : false;
      item.deletedAt = item.deletedAt ? new Date(item.deletedAt) : undefined;
      item.createdAt = item.createdAt ? new Date(item.createdAt) : undefined;
      item.updatedAt = item.updatedAt ? new Date(item.updatedAt) : undefined;

      await Product.updateOne(
        {
          _id: item._id,
        },
        item,
      );
    }

    res.json({
      code: "success",
      message: "Import thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Lỗi Import!",
    });
  }
};

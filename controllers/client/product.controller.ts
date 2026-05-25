import { Request, Response } from "express";
import CategoryProduct from "../../models/category-product.model";
import Product from "../../models/product.model";
import slugify from "slugify";
import AttributeProduct from "../../models/attribute-product.model";
import { formatProductItem } from "../../helpers/product.helper";

export const productByCategory = async (req: Request, res: Response) => {
  const slug = req.params.slug;
  let categoryDetail: any = null;

  if (slug) {
    categoryDetail = await CategoryProduct.findOne({
      slug: slug,
      deleted: false,
      status: "active",
    });
  } else {
    categoryDetail = {
      id: "",
      name: "Tất cả sản phẩm",
      slug: "",
    };
  }

  if (!categoryDetail) {
    res.redirect("/");
    return;
  }

  const find: {
    category?: string;
    deleted: boolean;
    status: string;
    search?: RegExp;
    priceNew?: {
      $gte: Number;
      $lte: Number;
    };
    discount?: {
      $gt: Number;
    };
    stock?: {
      $gt: Number;
    };
    $or?: any;
  } = {
    deleted: false,
    status: "active",
  };

  // Phân trang
  let limitItems = 20;
  if (req.query.limitItems && parseInt(`${req.query.limitItems}`) > 0) {
    limitItems = parseInt(`${req.query.limitItems}`);
  }

  let page = 1;
  if (req.query.page) {
    const currentPage = parseInt(`${req.query.page}`);
    if (currentPage > 0) {
      page = currentPage;
    }
  }
  const totalRecord = await Product.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    totalPage: totalPage,
    currentPage: page,
    totalRecord: totalRecord,
    skip: skip,
  };
  // Hết Phân trang

  // Sắp xếp
  const sort: any = {};
  if (req.query.sort) {
    const [sortKey, sortValue] = `${req.query.sort}`.split("-");

    switch (sortKey) {
      case "position":
        sort.position = sortValue;
        break;
      case "price":
        sort.priceNew = sortValue;
        sort.priceOld = sortValue;
        break;
      case "createdAt":
        sort.createdAt = sortValue;
        break;
      case "discount":
        sort.discount = sortValue;
        break;
      default:
        sort.position = "desc";
        break;
    }
  } else {
    sort.position = "desc";
  }
  // Hết Sắp xếp

  // Danh mục
  if (categoryDetail.id) {
    find.category = categoryDetail.id;
  }
  // hết Danh mục

  // Từ khóa
  if (req.query.keyword) {
    const keyword = slugify(`${req.query.keyword}`, {
      replacement: " ",
      lower: true,
    });

    const keywordRegex = new RegExp(keyword, "i");
    find.search = keywordRegex;
  }
  // End Từ khóa

  // Mức giá
  if (req.query.price) {
    const [priceMin, priceMax] = `${req.query.price}`.split("-");

    find.priceNew = {
      $gte: parseInt(priceMin),
      $lte: parseInt(priceMax),
    };
  }
  // Hết Mức giá

  // Giảm giá
  if (req.query.onSale && req.query.onSale == "true") {
    find.discount = {
      $gt: 0,
    };
  }
  // Hết Giảm giá

  // Còn hàng
  if (req.query.inStock && req.query.inStock == "true") {
    find.stock = {
      $gt: 0,
    };
  }
  // Hết Còn hàng

  // Thuộc tính
  const attributeFilters: any[] = [];

  Object.keys(req.query).forEach((key) => {
    if (key.startsWith("attribute_")) {
      const attrId = key.replace("attribute_", "");
      const values = `${req.query[key]}`.split("-");

      attributeFilters.push({
        variants: {
          $elemMatch: {
            status: true,
            attributeValue: {
              $elemMatch: {
                attrId: attrId,
                value: { $in: values },
              },
            },
          },
        },
      });

      if (attributeFilters.length > 0) {
        find.$or = attributeFilters;
      }
    }
  });
  // Hết Thuộc tính

  const productList: any = await Product.find(find)
    .sort(sort)
    .limit(limitItems)
    .skip(skip);

  for (const item of productList) {
    formatProductItem(item);
  }

  res.render("client/pages/product-by-category", {
    pageTitle: "Danh sách sản phẩm theo danh mục",
    categoryDetail: categoryDetail,
    productList: productList,
    pagination: pagination,
  });
};

export const suggest = async (req: Request, res: Response) => {
  try {
    const find: {
      deleted: boolean;
      status: string;
      search?: RegExp;
    } = {
      deleted: false,
      status: "active",
    };

    if (req.query.keyword) {
      const keyword = slugify(`${req.query.keyword}`, {
        replacement: " ",
        lower: true,
      });
      const keywordRegex = new RegExp(keyword, "i");
      find.search = keywordRegex;
    }

    const productList = await Product.find(find)
      .sort({
        position: "desc",
      })
      .select("images name slug priceNew priceOld")
      .lean()
      .limit(5);

    res.json({
      code: "success",
      message: "Thành công!",
      list: productList,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Lỗi khi lấy dữ liệu!",
    });
  }
};

export const detail = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    const productDetail: any = await Product.findOne({
      slug: slug,
      deleted: false,
      status: "active",
    });

    if (!productDetail) {
      res.redirect("/");
      return;
    }

    // Danh sách thuộc tính
    const attributeList: any = await AttributeProduct.find({
      _id: { $in: productDetail.attributes },
    });
    for (const attribute of attributeList) {
      const variantSet = new Set();
      const variantLabelSet = new Set();
      productDetail.variants
        .filter((variant: any) => variant.status)
        .forEach((variant: any) => {
          variant.attributeValue.forEach((attr: any) => {
            if (attr.attrId == attribute.id) {
              variantSet.add(attr.value);
              variantLabelSet.add(attr.label);
            }
          });
        });
      attribute.variants = [...variantSet];
      attribute.variantLabels = [...variantLabelSet];
    }
    // Hết Danh sách thuộc tính

    // Danh sách danh mục
    const categoryList = await CategoryProduct.find({
      _id: { $in: productDetail.category },
      deleted: false,
      status: "active",
    })
      .select("name slug")
      .lean();

    productDetail.categoryList = categoryList;
    // Hết Danh sách danh mục

    // Sản phẩm liên quan
    const relatedProducts = await Product.find({
      category: { $in: productDetail.category },
      deleted: false,
      status: "active",
      _id: { $ne: productDetail._id }, // Loại bỏ sản phẩm hiện tại
    })
      .limit(10)
      .sort({
        view: "desc",
      });

    for (const item of relatedProducts) {
      formatProductItem(item);
    }
    // Hết Sản phẩm liên quan

    // Sản phẩm mua kèm
    const boughtTogetherProducts = await Product.find({
      _id: { $in: productDetail.boughtTogether },
      deleted: false,
      status: "active",
    }).sort({
      position: "desc",
    });

    for (const item of boughtTogetherProducts) {
      formatProductItem(item);
    }
    // Hết Sản phẩm mua kèm

    // Lịch sử xem sản phẩm
    const productViewHistory = req.cookies.productViewHistory
      ? JSON.parse(req.cookies.productViewHistory)
      : [];

    const viewedProducts = await Product.find({
      _id: { $in: productViewHistory },
      deleted: false,
      status: "active",
    });

    for (const item of viewedProducts) {
      formatProductItem(item);
    }

    if (!productViewHistory.includes(productDetail.id)) {
      productViewHistory.unshift(productDetail.id);
      res.cookie("productViewHistory", JSON.stringify(productViewHistory), {
        httpOnly: true, // Chỉ cho phép server truy cập cookie, JavaScript ở client không thể đọc được
        secure: process.env.NODE_ENV === "production", // true: nếu là https, false: nếu là http
        sameSite: "strict", // Chỉ gửi cookie khi request từ cùng domain
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
      });
    }
    // Hết Lịch sử xem sản phẩm

    res.render("client/pages/product-detail", {
      pageTitle: productDetail.name,
      productDetail: productDetail,
      attributeList: attributeList,
      relatedProducts: relatedProducts,
      boughtTogetherProducts: boughtTogetherProducts,
      viewedProducts: viewedProducts,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

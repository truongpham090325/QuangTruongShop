import { Request, Response } from "express";
import Product from "../../models/product.model";
import CategoryProduct from "../../models/category-product.model";
import slugify from "slugify";

export const search = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.keyword ? `${req.query.keyword}`.trim() : "";

    // Hàm đệ quy lấy các ID danh mục con (phục vụ hiển thị số lượng sản phẩm ở sidebar)
    const getSubCategoryIds = async (parentId: string): Promise<string[]> => {
      const childs = await CategoryProduct.find({
        parent: parentId,
        deleted: false,
        status: "active",
      });
      let ids: string[] = [];
      for (const child of childs) {
        ids.push(child.id);
        const subIds = await getSubCategoryIds(child.id);
        ids = ids.concat(subIds);
      }
      return ids;
    };

    // Tạo bộ lọc cho sản phẩm
    const find: any = {
      deleted: false,
      status: "active",
    };

    // Lọc theo từ khóa tìm kiếm
    if (keyword) {
      const slugifiedKeyword = slugify(keyword, {
        replacement: " ",
        lower: true,
      });
      find.search = new RegExp(slugifiedKeyword, "i");
    }

    // Lọc theo mức giá
    if (req.query.priceMax) {
      const priceMax = parseInt(`${req.query.priceMax}`);
      if (!isNaN(priceMax)) {
        find.priceNew = { $lte: priceMax };
      }
    }

    // Sắp xếp
    const sort: any = {};
    if (req.query.sort) {
      const [sortKey, sortValue] = `${req.query.sort}`.split("-");
      if (sortKey && (sortValue === "asc" || sortValue === "desc")) {
        sort[sortKey] = sortValue;
      } else {
        sort.position = "desc";
      }
    } else {
      sort.position = "desc";
    }

    // Phân trang
    let page = 1;
    const limitItems = 9;
    if (req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const totalRecord = await Product.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItems);
    const skip = (page - 1) * limitItems;

    const pagination = {
      currentPage: page,
      totalRecord: totalRecord,
      totalPage: totalPage,
      limitItems: limitItems,
      skip: skip,
    };

    const products = await Product.find(find)
      .sort(sort)
      .limit(limitItems)
      .skip(skip);

    // Lấy 3 danh mục chính (parent: "") để hiển thị ở sidebar
    const mainCategories = await CategoryProduct.find({
      parent: "",
      deleted: false,
      status: "active",
    }).limit(3);

    const categoriesWithCount = [];
    for (const cat of mainCategories) {
      const subIds = await getSubCategoryIds(cat.id);
      const allIds = [cat.id, ...subIds];
      const count = await Product.countDocuments({
        category: { $in: allIds },
        deleted: false,
        status: "active",
      });
      categoriesWithCount.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: count,
      });
    }

    res.render("client/pages/search", {
      pageTitle: "Kết quả tìm kiếm",
      products: products,
      categoriesWithCount: categoriesWithCount,
      keyword: keyword,
      priceMax: req.query.priceMax || "",
      sort: req.query.sort || "position-desc",
      pagination: pagination,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

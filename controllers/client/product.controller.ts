import { Request, Response } from "express";
import Product from "../../models/product.model";
import CategoryProduct from "../../models/category-product.model";
import slugify from "slugify";

export const productByCategory = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    const categoryDetail = await CategoryProduct.findOne({
      slug: slug,
      deleted: false,
      status: "active",
    });

    if (!categoryDetail) {
      res.redirect("/");
      return;
    }

    // Hàm đệ quy lấy các ID danh mục con
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

    const subCategoryIds = await getSubCategoryIds(categoryDetail.id);
    const allCategoryIds = [categoryDetail.id, ...subCategoryIds];

    // Tạo bộ lọc cho sản phẩm
    const find: any = {
      category: { $in: allCategoryIds },
      deleted: false,
      status: "active",
    };

    // Lọc theo từ khóa tìm kiếm
    if (req.query.keyword) {
      const keyword = slugify(`${req.query.keyword}`, {
        replacement: " ",
        lower: true,
      });
      find.search = new RegExp(keyword, "i");
    }

    // Lọc theo mức giá
    if (req.query.priceMax) {
      const priceMax = parseInt(`${req.query.priceMax}`);
      if (!isNaN(priceMax)) {
        find.priceNew = { $lte: priceMax };
      }
    }

    const products = await Product.find(find).sort({ position: "desc" });

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

    res.render("client/pages/product-by-category", {
      pageTitle: categoryDetail.name,
      category: categoryDetail,
      products: products,
      categoriesWithCount: categoriesWithCount,
      keyword: req.query.keyword || "",
      priceMax: req.query.priceMax || "",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};


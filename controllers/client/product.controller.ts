import { Request, Response } from "express";
import Product from "../../models/product.model";
import CategoryProduct from "../../models/category-product.model";

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

    const products = await Product.find({
      category: { $in: allCategoryIds },
      deleted: false,
      status: "active",
    }).sort({ position: "desc" });

    res.render("client/pages/product-by-category", {
      pageTitle: categoryDetail.name,
      category: categoryDetail,
      products: products,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

import { Request, Response } from "express";
import Product from "../../models/product.model";
import CategoryProduct from "../../models/category-product.model";

export const home = async (req: Request, res: Response) => {
  try {
    const categoryProductList = await CategoryProduct.find({
      deleted: false,
    });

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

    // Hàm lấy sản phẩm theo slug danh mục
    const getProductsByCategorySlug = async (
      slug: string,
      limit: number = 8,
    ) => {
      const category = await CategoryProduct.findOne({
        slug: slug,
        deleted: false,
        status: "active",
      });

      if (!category) return [];

      const subCategoryIds = await getSubCategoryIds(category.id);
      const allCategoryIds = [category.id, ...subCategoryIds];

      const products = await Product.find({
        category: { $in: allCategoryIds },
        deleted: false,
        status: "active",
      })
        .sort({ position: "desc" })
        .limit(limit);

      return products;
    };

    // 1. Lấy danh sách sản phẩm Hoa quả 3 miền
    const products3Mien = await getProductsByCategorySlug(
      "hoa-qua-sach-3-mien",
    );

    // 2. Lấy danh sách sản phẩm Hoa quả nhập khẩu
    const productsNhapKhau =
      await getProductsByCategorySlug("hoa-qua-nhap-khau");

    // 3. Lấy danh sách sản phẩm Muối chấm
    const productsMuoiCham = await getProductsByCategorySlug("muoi-gia-vi");

    res.render("client/pages/home", {
      pageTitle: "Trang chủ",
      categoryProductList: categoryProductList,
      products3Mien: products3Mien,
      productsNhapKhau: productsNhapKhau,
      productsMuoiCham: productsMuoiCham,
    });
  } catch (error) {
    console.log(error);
  }
};

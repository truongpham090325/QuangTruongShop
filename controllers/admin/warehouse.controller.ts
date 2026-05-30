import { Request, Response } from "express";
import Warehouse from "../../models/warehouse.model";
import Product from "../../models/product.model";
import { pathAdmin } from "../../configs/variable.config";
import slugify from "slugify";

// List warehouses
export const list = async (req: Request, res: Response) => {
  try {
    const warehouses = await Warehouse.find({ deleted: false });

    // Calculate totals for each warehouse
    const warehouseList = [];
    for (const w of warehouses) {
      let uniqueProductsCount = 0;
      let totalStock = 0;

      for (const p of w.products) {
        if (p.stock && p.stock > 0) {
          uniqueProductsCount++;
          totalStock += p.stock;
        }
      }

      warehouseList.push({
        id: w._id,
        name: w.name,
        code: w.code,
        address: w.address,
        uniqueProductsCount,
        totalStock,
        createdAt: w.createdAt,
      });
    }

    res.render("admin/pages/warehouse-list", {
      pageTitle: "Quản lý kho hàng",
      warehouseList,
    });
  } catch (error) {
    console.error(error);
    res.redirect(`/${pathAdmin}/dashboard`);
  }
};

// Warehouse detail
export const detail = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const warehouse = await Warehouse.findOne({ _id: id, deleted: false }).populate("products.productId");

    if (!warehouse) {
      res.redirect(`/${pathAdmin}/warehouse/list`);
      return;
    }

    // Extract populated products and filter them
    let productList: any[] = [];
    for (const item of warehouse.products) {
      const prod: any = item.productId;
      if (prod && !prod.deleted) {
        productList.push({
          id: prod._id,
          name: prod.name,
          sku: prod.sku || "N/A",
          images: prod.images,
          priceNew: prod.priceNew,
          priceOld: prod.priceOld,
          status: prod.status,
          stock: item.stock || 0,
        });
      }
    }

    // Apply search keyword filter
    if (req.query.keyword) {
      const keyword = slugify(`${req.query.keyword}`, {
        replacement: " ",
        lower: true,
      });
      const regex = new RegExp(keyword, "i");
      productList = productList.filter((p) => {
        const searchStr = slugify(`${p.name} ${p.sku}`, { replacement: " ", lower: true });
        return regex.test(searchStr);
      });
    }

    // Paginate in-memory list
    let page = 1;
    const limitItems = 10;
    if (req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const totalRecord = productList.length;
    const totalPage = Math.ceil(totalRecord / limitItems);
    const skip = (page - 1) * limitItems;
    const pagination = {
      totalRecord,
      totalPage,
      skip,
    };

    const paginatedProducts = productList.slice(skip, skip + limitItems);

    res.render("admin/pages/warehouse-detail", {
      pageTitle: `Chi tiết ${warehouse.name}`,
      warehouse,
      productList: paginatedProducts,
      pagination,
    });
  } catch (error) {
    console.error(error);
    res.redirect(`/${pathAdmin}/warehouse/list`);
  }
};

// Bulk allocation view
export const allocation = async (req: Request, res: Response) => {
  try {
    const warehouses = await Warehouse.find({ deleted: false });

    // Search & pagination for products
    const find: any = { deleted: false };
    if (req.query.keyword) {
      const keyword = slugify(`${req.query.keyword}`, {
        replacement: " ",
        lower: true,
      });
      find.search = new RegExp(keyword, "i");
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
      totalRecord,
      totalPage,
      skip,
    };

    const products = await Product.find(find)
      .limit(limitItems)
      .skip(skip)
      .sort({ createdAt: "desc" });

    // Build grid of products with warehouse stocks
    const productGrid = [];
    for (const prod of products) {
      const warehouseStocks: any = {};
      for (const w of warehouses) {
        const item = w.products.find((p: any) => p.productId.toString() === prod.id.toString());
        warehouseStocks[w.id] = item ? (item.stock || 0) : 0;
      }

      productGrid.push({
        id: prod.id,
        name: prod.name,
        sku: prod.sku || "N/A",
        images: prod.images,
        totalStock: prod.stock || 0,
        warehouseStocks,
      });
    }

    res.render("admin/pages/warehouse-allocation", {
      pageTitle: "Phân bổ kho hàng",
      warehouses,
      productGrid,
      pagination,
    });
  } catch (error) {
    console.error(error);
    res.redirect(`/${pathAdmin}/warehouse/list`);
  }
};

// Bulk allocation save
export const allocationPost = async (req: Request, res: Response) => {
  try {
    const { allocations } = req.body; // Array of { productId, stocks: { warehouseId: stock } }

    if (!allocations || !Array.isArray(allocations)) {
      res.json({
        code: "error",
        message: "Dữ liệu không hợp lệ!",
      });
      return;
    }

    const warehouses = await Warehouse.find({ deleted: false });

    for (const alloc of allocations) {
      const { productId, stocks } = alloc;
      let totalStock = 0;

      // Update stock levels in each warehouse document
      for (const w of warehouses) {
        const stockVal = parseInt(stocks[w.id]) || 0;
        totalStock += stockVal;

        const prodIdx = w.products.findIndex((p: any) => p.productId.toString() === productId);
        if (prodIdx > -1) {
          w.products[prodIdx].stock = stockVal;
        } else {
          w.products.push({
            productId,
            stock: stockVal,
          });
        }
        await w.save();
      }

      // Synchronize back to Product collection total stock
      await Product.updateOne(
        { _id: productId },
        { stock: totalStock }
      );
    }

    res.json({
      code: "success",
      message: "Cập nhật phân bổ kho hàng thành công!",
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Cập nhật phân bổ kho hàng thất bại!",
    });
  }
};

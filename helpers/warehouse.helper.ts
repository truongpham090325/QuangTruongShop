import Warehouse from "../models/warehouse.model";
import Product from "../models/product.model";

export const initWarehouses = async () => {
  try {
    // Check if warehouses exist
    let warehouses: any[] = await Warehouse.find({ deleted: false });

    if (warehouses.length === 0) {
      // Create 3 warehouses
      const defaultWarehouses = [
        {
          name: "Kho Hà Nội",
          code: "K_HN",
          address: "123 Đường Láng, Đống Đa, Hà Nội",
          products: [],
        },
        {
          name: "Kho Đà Nẵng",
          code: "K_DN",
          address: "456 Nguyễn Văn Linh, Hải Châu, Đà Nẵng",
          products: [],
        },
        {
          name: "Kho TP. HCM",
          code: "K_HCM",
          address: "789 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh",
          products: [],
        },
      ];
      warehouses = (await Warehouse.insertMany(defaultWarehouses)) as any[];
      console.log("Đã tạo sẵn 3 kho hàng mặc định!");
    }

    // Now, synchronize all products
    const products = await Product.find({ deleted: false });
    for (const product of products) {
      let isDistributed = false;
      let totalWarehouseStock = 0;

      for (const w of warehouses) {
        const prodInWarehouse = w.products.find(
          (p: any) => p.productId.toString() === product.id.toString()
        );
        if (prodInWarehouse) {
          isDistributed = true;
          totalWarehouseStock += prodInWarehouse.stock || 0;
        }
      }

      // If not distributed, or if total stock doesn't match
      if (!isDistributed || totalWarehouseStock !== (product.stock || 0)) {
        const S = product.stock || 0;
        let s1 = 0, s2 = 0, s3 = 0;
        if (S > 0) {
          s1 = Math.floor(Math.random() * (S + 1));
          s2 = Math.floor(Math.random() * (S - s1 + 1));
          s3 = S - s1 - s2;
        }

        const stocks = [s1, s2, s3];

        for (let i = 0; i < warehouses.length; i++) {
          const w = warehouses[i];
          const prodIdx = w.products.findIndex(
            (p: any) => p.productId.toString() === product.id.toString()
          );

          if (prodIdx > -1) {
            w.products[prodIdx].stock = stocks[i] || 0;
          } else {
            w.products.push({
              productId: product._id,
              stock: stocks[i] || 0,
            });
          }
          await w.save();
        }
      }
    }
    console.log("Đồng bộ kho hàng thành công!");
  } catch (error) {
    console.error("Lỗi đồng bộ kho hàng:", error);
  }
};

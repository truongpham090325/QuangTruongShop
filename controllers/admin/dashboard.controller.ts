import { Request, Response } from "express";
import Order from "../../models/order.model";
import Product from "../../models/product.model";

export const dashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Fetch all orders (non-deleted)
    const allOrders = await Order.find({ deleted: false });

    // 2. Fetch all products to map details like import price (priceOld) and selling price (priceNew)
    const products = await Product.find({});
    const productMap = new Map();
    products.forEach((p: any) => {
      productMap.set(p._id.toString(), p);
    });

    // 3. Filter orders matching: paymentStatus is "paid" AND orderStatus is "completed"
    const completedOrders = allOrders.filter(
      (o: any) => o.paymentStatus === "paid" && o.orderStatus === "completed"
    );

    const totalOrdersCount = allOrders.length;
    const completedOrdersCount = completedOrders.length;

    let totalRevenue = 0;
    let totalProfit = 0;

    // Grouping variables
    const dailyData: Record<string, { revenue: number; profit: number; count: number }> = {};
    const monthlyData: Record<string, { revenue: number; profit: number; count: number }> = {};
    const yearlyData: Record<string, { revenue: number; profit: number; count: number }> = {};

    // Product performance map
    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};

    // Order status counters
    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
      returned: 0,
    };

    // Calculate status distribution
    allOrders.forEach((o: any) => {
      if (o.orderStatus && statusCounts[o.orderStatus] !== undefined) {
        statusCounts[o.orderStatus]++;
      }
    });

    // Process completed & paid orders for financial stats
    completedOrders.forEach((order: any) => {
      const revenue = order.total || 0;
      totalRevenue += revenue;

      let orderProfit = 0;
      (order.items || []).forEach((item: any) => {
        const prodId = item.productId;
        const prod = productMap.get(prodId);

        const importPrice = prod ? (prod.priceOld || 0) : 0;
        const sellPrice = item.price || (prod ? (prod.priceNew || 0) : 0);
        const itemProfit = (importPrice - sellPrice) * (item.quantity || 0);
        orderProfit += itemProfit;

        // Keep track of product sales performance
        if (prodId) {
          if (!productSalesMap[prodId]) {
            productSalesMap[prodId] = {
              name: item.name || (prod ? prod.name : "Sản phẩm không tên"),
              quantity: 0,
              revenue: 0,
              profit: 0,
            };
          }
          productSalesMap[prodId].quantity += item.quantity || 0;
          productSalesMap[prodId].revenue += (item.price || 0) * (item.quantity || 0);
          productSalesMap[prodId].profit += itemProfit;
        }
      });

      totalProfit += orderProfit;

      // Grouping by time (based on order creation date)
      const date = new Date(order.createdAt);
      if (!isNaN(date.getTime())) {
        const yyyy = date.getFullYear().toString();
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');

        const dayKey = `${yyyy}-${mm}-${dd}`;
        const monthKey = `${yyyy}-${mm}`;
        const yearKey = yyyy;

        // Day grouping
        if (!dailyData[dayKey]) dailyData[dayKey] = { revenue: 0, profit: 0, count: 0 };
        dailyData[dayKey].revenue += revenue;
        dailyData[dayKey].profit += orderProfit;
        dailyData[dayKey].count += 1;

        // Month grouping
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, profit: 0, count: 0 };
        monthlyData[monthKey].revenue += revenue;
        monthlyData[monthKey].profit += orderProfit;
        monthlyData[monthKey].count += 1;

        // Year grouping
        if (!yearlyData[yearKey]) yearlyData[yearKey] = { revenue: 0, profit: 0, count: 0 };
        yearlyData[yearKey].revenue += revenue;
        yearlyData[yearKey].profit += orderProfit;
        yearlyData[yearKey].count += 1;
      }
    });

    // 1. Prepare daily stats (for the last 30 calendar days)
    const last30DaysList: { date: string; revenue: number; profit: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear().toString();
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      last30DaysList.push({
        date: `${dd}/${mm}`,
        revenue: dailyData[key] ? dailyData[key].revenue : 0,
        profit: dailyData[key] ? dailyData[key].profit : 0,
      });
    }

    // 2. Prepare monthly stats (for the current year, 12 months)
    const currentYear = today.getFullYear();
    const last12MonthsList: { month: string; revenue: number; profit: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const yyyy = currentYear;
      const mm = (i + 1).toString().padStart(2, '0');
      const key = `${yyyy}-${mm}`;

      last12MonthsList.push({
        month: `Tháng ${i + 1}`,
        revenue: monthlyData[key] ? monthlyData[key].revenue : 0,
        profit: monthlyData[key] ? monthlyData[key].profit : 0,
      });
    }

    // 3. Prepare yearly stats
    const yearlyList = Object.keys(yearlyData).sort().map((year) => ({
      year: year,
      revenue: yearlyData[year].revenue,
      profit: yearlyData[year].profit,
      count: yearlyData[year].count,
    }));

    // 4. Top 5 selling products (by profit margin)
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    res.render("admin/pages/dashboard", {
      pageTitle: "Tổng quan thống kê kinh doanh",
      stats: {
        totalOrders: totalOrdersCount,
        completedOrders: completedOrdersCount,
        totalRevenue: totalRevenue,
        totalProfit: totalProfit,
      },
      statusCounts: statusCounts,
      last30DaysList: JSON.stringify(last30DaysList),
      last12MonthsList: JSON.stringify(last12MonthsList),
      yearlyList: JSON.stringify(yearlyList),
      topProducts: JSON.stringify(topProducts),
      rawYearlyList: yearlyList,
    });
  } catch (error) {
    console.error("Dashboard controller error:", error);
    res.render("admin/pages/dashboard", {
      pageTitle: "Tổng quan thống kê kinh doanh",
      stats: {
        totalOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
      },
      statusCounts: { pending: 0, confirmed: 0, shipping: 0, completed: 0, cancelled: 0, returned: 0 },
      last30DaysList: "[]",
      last12MonthsList: "[]",
      yearlyList: "[]",
      topProducts: "[]",
      rawYearlyList: [],
    });
  }
};
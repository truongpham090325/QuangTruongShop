import mongoose from "mongoose";
import { initWarehouses } from "../helpers/warehouse.helper";

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE}`);
    console.log("Kết nối DB thành công!");
    await initWarehouses();
  } catch (error) {
    console.log("Kết nối DB thất bại!", error);
  }
};

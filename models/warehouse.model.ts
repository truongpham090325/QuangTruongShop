import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: String,
    code: String,
    address: String,
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        stock: {
          type: Number,
          default: 0,
        },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

const Warehouse = mongoose.model("Warehouse", schema, "warehouses");

export default Warehouse;

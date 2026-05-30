import { Router } from "express";
import * as warehouseController from "../../controllers/admin/warehouse.controller";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/list", warehouseController.list);
router.get("/detail/:id", warehouseController.detail);
router.get("/allocation", warehouseController.allocation);
router.post("/allocation", upload.none(), warehouseController.allocationPost);

export default router;

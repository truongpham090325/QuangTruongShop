import { Router } from "express";
import * as couponController from "../../controllers/admin/coupon.controller";
import * as couponValidate from "../../validations/admin/coupon.validate";
import multer from "multer";

const router = Router();

const upload = multer();

router.get("/create", couponController.create);

router.post(
  "/create",
  upload.none(),
  couponValidate.createPost,
  couponController.createPost,
);

router.get("/list", couponController.list);

router.get("/edit/:id", couponController.edit);

router.patch(
  "/edit/:id",
  upload.none(),
  couponValidate.createPost,
  couponController.editPatch,
);

router.patch("/delete/:id", couponController.deletePatch);

router.get("/trash", couponController.trash);

router.patch("/undo/:id", couponController.undoPatch);

router.delete("/destroy/:id", couponController.destroyDelete);

export default router;

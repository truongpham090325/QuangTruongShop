import { Router } from "express";
import * as roleController from "../../controllers/admin/role.controller";
import * as roleValidate from "../../validations/admin/role.validate";
import multer from "multer";

const router = Router();

const upload = multer();

router.get("/create", roleController.create);

router.post(
  "/create",
  upload.none(),
  roleValidate.createPost,
  roleController.createPost,
);

router.get("/list", roleController.list);

router.get("/edit/:id", roleController.edit);

router.patch(
  "/edit/:id",
  upload.none(),
  roleValidate.createPost,
  roleController.editPatch,
);

router.patch("/delete/:id", roleController.deletePatch);

router.get("/trash", roleController.trash);

router.patch("/undo/:id", roleController.undoPatch);

router.delete("/destroy/:id", roleController.destroyDelete);

export default router;

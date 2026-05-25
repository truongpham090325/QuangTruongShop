import { Router } from "express";
import * as productController from "../../controllers/admin/product.controller";
import * as productValidate from "../../validations/admin/product.validate";
import multer from "multer";

const router = Router();

const upload = multer();

router.get("/category", productController.category);

router.get("/category/create", productController.createCategory);

router.post(
  "/category/create",
  upload.none(),
  productValidate.createCategoryPost,
  productController.createCategoryPost,
);

router.get("/category/edit/:id", productController.editCategory);

router.patch(
  "/category/edit/:id",
  upload.none(),
  productValidate.createCategoryPost,
  productController.editCategoryPatch,
);

router.patch("/category/delete/:id", productController.deleteCategoryPatch);

router.get("/category/trash", productController.trashCategory);

router.patch("/category/undo/:id", productController.undoCategoryPatch);

router.delete("/category/destroy/:id", productController.destroyCategoryDelete);

router.get("/create", productController.create);

router.post(
  "/create",
  upload.none(),
  productValidate.createPost,
  productController.createPost,
);

router.get("/attribute", productController.attribute);

router.get("/attribute/create", productController.createAttribute);

router.post(
  "/attribute/create",
  upload.none(),
  productValidate.createAttributePost,
  productController.createAttributePost,
);

router.get("/attribute/edit/:id", productController.editAttribute);

router.patch(
  "/attribute/edit/:id",
  upload.none(),
  productValidate.createAttributePost,
  productController.editAttributePatch,
);

router.patch("/attribute/delete/:id", productController.deleteAttributePatch);

router.get("/attribute/trash", productController.trashAttribute);

router.patch("/attribute/undo/:id", productController.undoAttributePatch);

router.delete(
  "/attribute/destroy/:id",
  productController.destroyAttributeDelete,
);

router.get("/list", productController.list);

router.get("/edit/:id", productController.edit);

router.patch(
  "/edit/:id",
  upload.none(),
  productValidate.createPost,
  productController.editPatch,
);

router.patch("/delete/:id", productController.deletePatch);

router.get("/trash", productController.trash);

router.patch("/undo/:id", productController.undoPatch);

router.delete("/destroy/:id", productController.destroyDelete);

router.get("/export/csv", productController.exportCSV);

router.post(
  "/import/csv",
  upload.single("file"),
  productValidate.importCSVPost,
  productController.importCSVPost,
);

export default router;

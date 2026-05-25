import { Router } from "express";
import * as adminLogController from "../../controllers/admin/admin-log.controller";

const router = Router();

router.get("/list", adminLogController.list);

router.patch("/delete/:id", adminLogController.deletePatch);

router.get("/trash", adminLogController.trash);

router.patch("/undo/:id", adminLogController.undoPatch);

router.delete("/destroy/:id", adminLogController.destroyDelete);

export default router;

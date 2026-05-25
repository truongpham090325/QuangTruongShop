import { Router } from "express";
import * as accountUserController from "../../controllers/admin/account-user.controller";

const router = Router();

router.get("/list", accountUserController.list);

router.patch("/delete/:id", accountUserController.deletePatch);

router.get("/trash", accountUserController.trash);

router.patch("/undo/:id", accountUserController.undoPatch);

router.delete("/destroy/:id", accountUserController.destroyDelete);

export default router;

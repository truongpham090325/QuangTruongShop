import { Router } from "express";
import * as accountController from "../../controllers/admin/account.controller";
import * as accountValidate from "../../validations/admin/account.validate";
import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router = Router();

router.get("/login", accountController.login);

router.post("/login", accountValidate.loginPost, accountController.loginPost);

router.get("/logout", authMiddleware.verifyToken, accountController.logout);

export default router;

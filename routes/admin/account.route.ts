import { Router } from "express";
import * as accountController from "../../controllers/admin/account.controller";
import * as accountValidate from "../../validations/admin/account.validate";
import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router = Router();

router.get("/login", accountController.login);

router.post("/login", accountValidate.loginPost, accountController.loginPost);

router.get("/logout", authMiddleware.verifyToken, accountController.logout);

router.get("/forgot-password", accountController.forgotPassword);

router.post(
  "/forgot-password",
  accountValidate.forgotPasswordPost,
  accountController.forgotPasswordPost,
);

router.get("/otp-password", accountController.otpPassword);

router.post(
  "/otp-password",
  accountValidate.otpPasswordPost,
  accountController.otpPasswordPost,
);

router.get(
  "/reset-password",
  authMiddleware.verifyToken,
  accountController.resetPassword,
);

router.post(
  "/reset-password",
  authMiddleware.verifyToken,
  accountValidate.resetPasswordPost,
  accountController.resetPasswordPost,
);

export default router;

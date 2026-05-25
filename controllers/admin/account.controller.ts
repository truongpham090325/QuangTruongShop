import { Request, Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import AccountAdmin from "../../models/account-admin.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pathAdmin } from "../../configs/variable.config";
import { logAdminAction } from "../../helpers/log.helper";

export const login = (req: Request, res: Response) => {
  res.render("admin/pages/account-login", {
    pageTitle: "Trang đăng nhập quản trị",
  });
};

export const loginPost = async (req: RequestAccount, res: Response) => {
  try {
    const { email, password, rememberPassword } = req.body;

    let token = "";

    if (email === process.env.SUPER_ADMIN_EMAIL) {
      const isMatch = password === process.env.SUPER_ADMIN_PASSWORD;

      if (!isMatch) {
        res.json({
          code: "error",
          message: "Mật khẩu không chính xác!",
        });
        return;
      }

      // Tạo JWT token
      token = jwt.sign(
        {
          id: process.env.SUPER_ADMIN_ID,
          email: process.env.SUPER_ADMIN_EMAIL,
        },
        `${process.env.JWT_SECRET}`,
        {
          expiresIn: rememberPassword == "true" ? "7d" : "1d", // 7 ngày hoặc 1 ngày
        },
      );

      req.adminId = process.env.SUPER_ADMIN_ID;
    } else {
      const existAccount: any = await AccountAdmin.findOne({
        email: email,
        deleted: false,
      });

      if (!existAccount) {
        res.json({
          code: "error",
          message: "Email không tồn tại trong hệ thống!",
        });
        return;
      }

      // Giải mã mật khẩu
      const isPassword = await bcrypt.compare(
        password,
        `${existAccount.password}`,
      );

      if (!isPassword) {
        res.json({
          code: "error",
          message: "Mật khẩu không chính xác!",
        });
        return;
      }

      if (existAccount.status == "initial") {
        res.json({
          code: "error",
          message: "Tài khoản chưa được kích hoạt!",
        });
        return;
      }

      // Tạo JWT token
      token = jwt.sign(
        {
          id: existAccount.id,
          email: existAccount.email,
        },
        `${process.env.JWT_SECRET}`,
        {
          expiresIn: rememberPassword == "true" ? "7d" : "1d", // 7 ngày hoặc 1 ngày
        },
      );

      req.adminId = existAccount.id;
    }

    res.cookie("tokenAdmin", token, {
      httpOnly: true, // Chỉ cho phép server truy cập cookie, JavaScript ở client không thể đọc được
      secure: `${process.env.NODE_ENV}` == "production", // nếu "" là http, nếu "production" là https
      sameSite: "strict", // Chỉ gửi cookie khi request từ cùng domain
      maxAge: rememberPassword ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 ngày hoặc 1 ngày
    });

    logAdminAction(req, "Đã đăng nhập");

    res.json({
      code: "success",
      message: "Đăng nhập thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const logout = (req: Request, res: Response) => {
  logAdminAction(req, "Đã đăng xuất");
  res.clearCookie("tokenAdmin");
  res.redirect(`/${pathAdmin}/account/login`);
};

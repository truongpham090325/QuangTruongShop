import { Request, Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import AccountAdmin from "../../models/account-admin.model";
import VerifyOTP from "../../models/verify-otp.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pathAdmin } from "../../configs/variable.config";
import { logAdminAction } from "../../helpers/log.helper";
import { generateRandomNumber } from "../../helpers/generate.helper";
import { sendMail } from "../../helpers/mail.helper";

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

export const forgotPassword = (req: Request, res: Response) => {
  res.render("admin/pages/forgot-password", {
    pageTitle: "Trang quên mật khẩu",
  });
};

export const forgotPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const existAccount = await AccountAdmin.findOne({
      email: email,
      deleted: false,
      status: "active",
    });

    if (!existAccount) {
      res.json({
        code: "error",
        message: "Tài khoản không tồn tại!",
      });
      return;
    }

    // Tạo mã OTP
    const otp = generateRandomNumber(4);

    // Xóa OTP cũ của email này nếu có
    await VerifyOTP.deleteMany({
      email: email,
      type: "otp-password",
    });

    const newRecord = new VerifyOTP({
      email: email,
      otp: otp,
      type: "otp-password",
      expireAt: new Date(Date.now() + 5 * 60 * 1000), // 5 phút
    });

    await newRecord.save();

    // Gửi mail tự động
    const title = `Mã OTP lấy lại mật khẩu`;
    const content = `Mã OTP của bạn là ${otp}. Mã OTP này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã OTP cho bất kỳ ai.`;
    sendMail(email, title, content);

    res.json({
      code: "success",
      message:
        "Chúng tôi đã gửi mã OTP qua email. Vui lòng kiểm tra email của bạn!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const otpPassword = (req: Request, res: Response) => {
  const email = req.query.email;
  res.render("admin/pages/otp-password", {
    pageTitle: "Trang nhập mã OTP",
    email: email,
  });
};

export const otpPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const existAccount = await AccountAdmin.findOne({
      email: email,
      deleted: false,
      status: "active",
    });

    if (!existAccount) {
      res.json({
        code: "error",
        message: "Tài khoản không tồn tại!",
      });
      return;
    }

    const existverifyOTP = await VerifyOTP.findOne({
      otp: otp,
      email: email,
      type: "otp-password",
    });

    if (!existverifyOTP) {
      res.json({
        code: "error",
        message: "Mã OTP không đúng!",
      });
      return;
    }

    const tokenAdmin = jwt.sign(
      {
        id: existAccount.id,
        email: existAccount.email,
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: "1d",
      },
    );

    res.cookie("tokenAdmin", tokenAdmin, {
      httpOnly: true,
      secure: `${process.env.NODE_ENV}` == "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
      sameSite: "strict",
    });

    // Xóa mã OTP sau khi xác thực thành công
    await VerifyOTP.deleteOne({ _id: existverifyOTP._id });

    res.json({
      code: "success",
      message: "Xác thực OTP thành công! Vui lòng đổi mật khẩu mới!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const resetPassword = (req: Request, res: Response) => {
  res.render("admin/pages/reset-password", {
    pageTitle: "Đổi mật khẩu",
  });
};

export const resetPasswordPost = async (req: RequestAccount, res: Response) => {
  try {
    const { password } = req.body;
    const adminId = req.adminId;

    if (!adminId) {
      res.json({
        code: "error",
        message: "Phiên làm việc không hợp lệ!",
      });
      return;
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await AccountAdmin.updateOne(
      {
        _id: adminId,
      },
      {
        password: hashPassword,
      },
    );

    res.json({
      code: "success",
      message: "Đã đổi mật khẩu thành công!",
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

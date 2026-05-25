import e, { Request, Response } from "express";
import AccountUser from "../../models/account-user.model";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import jwt from "jsonwebtoken";
import { generateRandomNumber } from "../../helpers/generate.helper";
import VerifyOTP from "../../models/verify-otp.model";
import { sendMail } from "../../helpers/mail.helper";

export const register = (req: Request, res: Response) => {
  res.render("client/pages/register", {
    pageTitle: "Đăng ký tài khoản",
  });
};

export const registerPost = async (req: Request, res: Response) => {
  try {
    const existEmail = await AccountUser.findOne({
      email: req.body.email,
    });

    if (existEmail) {
      res.json({
        code: "error",
        message: "Email đã được sử dụng!",
      });
      return;
    }

    const existPhone = await AccountUser.findOne({
      phone: req.body.phone,
    });

    if (existPhone) {
      res.json({
        code: "error",
        message: "Số điện thoại đã được sử dụng!",
      });
      return;
    }

    req.body.status = "active";

    // Mã hóa mật khẩu
    req.body.password = await bcrypt.hash(req.body.password, 10);

    req.body.search = slugify(
      `${req.body.fullName} ${req.body.email} ${req.body.phone}`,
      {
        replacement: " ",
        lower: true,
      },
    );

    const newRecord = new AccountUser(req.body);
    await newRecord.save();

    const tokenUser = jwt.sign(
      {
        id: newRecord.id,
        email: newRecord.email,
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: "3d",
      },
    );

    res.cookie("tokenUser", tokenUser, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    res.json({
      code: "success",
      message: "Đăng ký thành công!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const login = (req: Request, res: Response) => {
  res.render("client/pages/login", {
    pageTitle: "Đăng nhập tài khoản",
  });
};

export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberPassword } = req.body;

    const existAccount = await AccountUser.findOne({
      email: email,
    });

    if (!existAccount) {
      res.json({
        code: "error",
        message: "Tài khoản không tồn tại!",
      });
      return;
    }

    const isPassword = await bcrypt.compare(
      password,
      `${existAccount.password}`,
    );
    if (!isPassword) {
      res.json({
        code: "error",
        message: "Mật khâu không chính xác!",
      });
      return;
    }

    if (existAccount.status != "active") {
      res.json({
        code: "error",
        message: "Tài khoản không hoạt động!",
      });
      return;
    }

    const tokenUser = jwt.sign(
      {
        id: existAccount.id,
        email: existAccount.email,
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: rememberPassword ? "7d" : "3d",
      },
    );

    res.cookie("tokenUser", tokenUser, {
      httpOnly: true,
      maxAge: rememberPassword
        ? 7 * 24 * 60 * 60 * 1000
        : 3 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

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

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("tokenUser");
  res.redirect("/auth/login");
};

export const callbackGoogle = async (req: Request, res: Response) => {
  const user = req.user as any;

  const tokenUser = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    `${process.env.JWT_SECRET}`,
    {
      expiresIn: "1d",
    },
  );

  res.cookie("tokenUser", tokenUser, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    sameSite: "lax",
  });

  res.redirect("/");
};

export const callbackFacebook = async (req: Request, res: Response) => {
  const user = req.user as any;

  const tokenUser = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    `${process.env.JWT_SECRET}`,
    {
      expiresIn: "1d",
    },
  );

  res.cookie("tokenUser", tokenUser, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    sameSite: "lax",
  });

  res.redirect("/");
};

export const forgotPassword = (req: Request, res: Response) => {
  res.render("client/pages/forgot-password", {
    pageTitle: "Quên mật khẩu",
  });
};

export const forgotPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const existAccount = await AccountUser.findOne({
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

    const existverifyOTP = await VerifyOTP.findOne({
      email: email,
      type: "otp-password",
    });

    if (existverifyOTP) {
      res.json({
        code: "error",
        message: "Vui lòng gửi lại yêu cầu sau 5 phút!",
      });
      return;
    }

    const newRecord = new VerifyOTP({
      email: email,
      otp: otp,
      type: "otp-password",
      expireAt: Date.now() + 5 * 60 * 1000, // 5 phút
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

export const otpPassword = async (req: Request, res: Response) => {
  const email = req.query.email;

  res.render("client/pages/otp-password", {
    pageTitle: "Xác thực OTP",
    email: email,
  });
};

export const otpPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const existAccount = await AccountUser.findOne({
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

    const tokenUser = jwt.sign(
      {
        id: existAccount.id,
        email: existAccount.email,
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: "1d",
      },
    );

    res.cookie("tokenUser", tokenUser, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
      sameSite: "strict",
    });

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
  res.render("client/pages/reset-password", {
    pageTitle: "Đổi mật khẩu",
  });
};

export const resetPasswordPost = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const userId = res.locals.accountUser.id;

    const hashPassword = await bcrypt.hash(password, 10);

    await AccountUser.updateOne(
      {
        _id: userId,
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

import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export const loginPost = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    email: Joi.string().required().email().messages({
      "string.empty": "Vui lòng nhập email!",
      "string.email": "Email không đúng định dạng!",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Vui lòng nhập mật khẩu!",
    }),
    rememberPassword: Joi.allow(""),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    const errorMessage = error.details[0].message;

    res.json({
      code: "error",
      message: errorMessage,
    });
    return;
  }

  next();
};

export const forgotPasswordPost = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Vui lòng nhập email!",
      "string.email": "Email không đúng định dạng!",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    const errorMessage = error.details[0].message;

    res.json({
      code: "error",
      message: errorMessage,
    });
    return;
  }

  next();
};

export const otpPasswordPost = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Vui lòng gửi kèm email!",
      "string.email": "Email không đúng định dạng!",
    }),
    otp: Joi.string().required().messages({
      "string.empty": "Vui lòng nhập mã OTP!",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    const errorMessage = error.details[0].message;

    res.json({
      code: "error",
      message: errorMessage,
    });
    return;
  }

  next();
};

export const resetPasswordPost = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const schema = Joi.object({
    password: Joi.string()
      .min(8)
      .custom((value, helpers) => {
        if (!/[A-Z]/.test(value)) {
          return helpers.error("password.uppercase");
        }
        if (!/[a-z]/.test(value)) {
          return helpers.error("password.lowercase");
        }
        if (!/\d/.test(value)) {
          return helpers.error("password.number");
        }
        if (!/[~!@#$%^&*]/.test(value)) {
          return helpers.error("password.special");
        }
        return value;
      })
      .required()
      .messages({
        "string.empty": "Vui lòng nhập mật khẩu!",
        "string.min": "Mật khẩu phải có ít nhất 8 ký tự!",
        "password.uppercase": "Mật khẩu phải có ít nhất một chữ cái viết hoa!",
        "password.lowercase":
          "Mật khẩu phải có ít nhất một chữ cái viết thường!",
        "password.number": "Mật khẩu phải có ít nhất một chữ số!",
        "password.special":
          "Mật khẩu phải có ít nhất một ký tự đặc biệt! (~!@#$%^&*)",
      }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    const errorMessage = error.details[0].message;

    res.json({
      code: "error",
      message: errorMessage,
    });
    return;
  }

  next();
};


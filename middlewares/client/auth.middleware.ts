import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AccountUser from "../../models/account-user.model";
import UserAddress from "../../models/user-address.model";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.tokenUser;

  if (token) {
    const decoded = jwt.verify(
      token,
      `${process.env.JWT_SECRET}`,
    ) as jwt.JwtPayload;

    const existAccount = await AccountUser.findOne({
      _id: decoded.id,
      email: decoded.email,
      status: "active",
      deleted: false,
    });

    if (existAccount) {
      const addressList = await UserAddress.find({
        userId: existAccount.id,
      }).sort({
        createdAt: "desc",
      });

      res.locals.accountUser = {
        id: existAccount.id,
        email: existAccount.email,
        fullName: existAccount.fullName,
        phone: existAccount.phone,
        avatar: existAccount.avatar,
        addressList: addressList,
      };
    }
  }

  next();
};

export const loggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!res.locals.accountUser) {
    if (req.method == "GET") {
      res.redirect("/auth/login");
      return;
    } else {
      res.json({
        code: "error",
        message: "Vui lòng đăng nhập!",
      });
      return;
    }
  }

  next();
};

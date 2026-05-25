import { NextFunction, Request, Response } from "express";
import { pathAdmin, permissionList } from "../../configs/variable.config";
import jwt, { JwtPayload } from "jsonwebtoken";
import AccountAdmin from "../../models/account-admin.model";
import Role from "../../models/role.model";
import { RequestAccount } from "../../interfaces/request.interface";

export const verifyToken = async (
  req: RequestAccount,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.tokenAdmin;
    if (!token) {
      res.redirect(`/${pathAdmin}/account/login`);
      return;
    }

    const decoded = jwt.verify(
      token,
      `${process.env.JWT_SECRET}`,
    ) as JwtPayload;

    if (
      decoded.id === process.env.SUPER_ADMIN_ID &&
      decoded.email === process.env.SUPER_ADMIN_EMAIL
    ) {
      res.locals.accountAdmin = {
        fullName: "Super Admin",
        email: process.env.SUPER_ADMIN_EMAIL,
        avatar: "/admin/assets/images/users/avatar-1.jpg",
        isSuperAdmin: true,
      };

      res.locals.permissions = permissionList.map((item) => item.id);
      req.adminId = process.env.SUPER_ADMIN_ID;
    } else {
      const existAccount = await AccountAdmin.findOne({
        _id: decoded.id,
        email: decoded.email,
        deleted: false,
        status: "active",
      });

      if (!existAccount) {
        res.redirect(`/${pathAdmin}/account/login`);
        return;
      }

      res.locals.accountAdmin = {
        fullName: existAccount.fullName,
        email: existAccount.email,
        avatar: existAccount.avatar,
        isSuperAdmin: false,
      };

      let permissions: string[] = [];
      for (const roleId of existAccount.roles) {
        const roleInfo = await Role.findOne({
          _id: roleId,
          deleted: false,
          status: "active",
        });

        if (roleInfo) {
          permissions = [...permissions, ...roleInfo.permissions];
        }

        res.locals.permissions = permissions;
        req.adminId = existAccount.id;
      }
    }

    next();
  } catch (error) {
    console.log(error);
    res.redirect(`/${pathAdmin}/account/login`);
  }
};

export const checkPermissions = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.permissions.includes(permission)) {
      next();
    } else {
      res.json({
        code: "error",
        message: "Không có quyền!",
      });
      return;
    }
  };
};

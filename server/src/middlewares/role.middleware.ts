import { NextFunction, Request, Response } from "express";
import { IUser } from "../models/User.model";

type UserRole = IUser["role"];

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden: you do not have permission to access this resource",
      });
      return;
    }

    next();
  };
};

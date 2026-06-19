import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../models/User.model";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface AuthTokenPayload extends JwtPayload {
  userId: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
    return;
  }

  const token = authorizationHeader.slice(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({
      success: false,
      message: "JWT authentication is not configured",
    });
    return;
  }

  let payload: AuthTokenPayload;

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "string" || typeof decoded.userId !== "string") {
      throw new Error("Invalid token payload");
    }

    payload = decoded as AuthTokenPayload;
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }

  try {
    const user = await User.findById(payload.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while authenticating the user",
    });
  }
};

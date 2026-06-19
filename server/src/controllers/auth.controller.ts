import { Request, Response } from "express";
import User, { IUser } from "../models/User.model";
import { generateToken } from "../utils/generateToken";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getSafeUser = (user: InstanceType<typeof User>) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  addresses: user.addresses,
});

const getSafeProfile = (user: IUser) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  addresses: user.addresses,
});

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        success: false,
        message: "Name is required",
      });
      return;
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
      return;
    }

    if (!password || typeof password !== "string") {
      res.status(400).json({
        success: false,
        message: "Password is required",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
      return;
    }

    if (role && role !== "user") {
      res.status(400).json({
        success: false,
        message: "You cannot choose an admin role during registration",
      });
      return;
    }

    const existingUser = await User.exists({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: typeof phone === "string" ? phone.trim() : undefined,
      role: "user",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: getSafeUser(user),
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong while registering the user",
    });
  }
};

export const loginUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (
      !email ||
      typeof email !== "string" ||
      !email.trim() ||
      !password ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const token = generateToken(String(user._id));

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: getSafeUser(user),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while logging in",
    });
  }
};

export const getCurrentUser = (req: Request, res: Response): void => {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: "Authentication is required",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user: getSafeProfile(user),
    },
  });
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    if (
      typeof req.body !== "object" ||
      req.body === null ||
      Array.isArray(req.body)
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide a name or email to update",
      });
      return;
    }

    const allowedFields = new Set(["name", "email"]);
    const unsupportedFields = Object.keys(req.body).filter(
      (field) => !allowedFields.has(field)
    );

    if (unsupportedFields.length > 0) {
      res.status(400).json({
        success: false,
        message: "Only name and email can be updated",
      });
      return;
    }

    const { name, email } = req.body;

    if (name === undefined && email === undefined) {
      res.status(400).json({
        success: false,
        message: "Please provide a name or email to update",
      });
      return;
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({
          success: false,
          message: "Name must be a non-empty string",
        });
        return;
      }

      user.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        res.status(400).json({
          success: false,
          message: "Email must be a non-empty string",
        });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!emailRegex.test(normalizedEmail)) {
        res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
        return;
      }

      if (normalizedEmail !== user.email) {
        const existingUser = await User.exists({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });

        if (existingUser) {
          res.status(409).json({
            success: false,
            message: "Email is already registered",
          });
          return;
        }

        user.email = normalizedEmail;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: getSafeProfile(user),
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong while updating the profile",
    });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    if (
      typeof req.body !== "object" ||
      req.body === null ||
      Array.isArray(req.body)
    ) {
      res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
      return;
    }

    const allowedFields = new Set(["currentPassword", "newPassword"]);
    const unsupportedFields = Object.keys(req.body).filter(
      (field) => !allowedFields.has(field)
    );

    if (unsupportedFields.length > 0) {
      res.status(400).json({
        success: false,
        message: "Only currentPassword and newPassword can be provided",
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (
      !currentPassword ||
      typeof currentPassword !== "string" ||
      !currentPassword.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Current password is required",
      });
      return;
    }

    if (!newPassword || typeof newPassword !== "string") {
      res.status(400).json({
        success: false,
        message: "New password is required",
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
      return;
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authenticated user no longer exists",
      });
      return;
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while changing the password",
    });
  }
};

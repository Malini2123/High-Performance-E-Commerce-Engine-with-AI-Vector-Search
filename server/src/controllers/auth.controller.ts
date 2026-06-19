import { Request, Response } from "express";
import User from "../models/User.model";
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
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
      },
    },
  });
};

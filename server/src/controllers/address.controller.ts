import { Request, Response } from "express";
import { Types } from "mongoose";
import { IAddress, IUser } from "../models/User.model";

type AddressInput = Omit<IAddress, "_id">;

const requiredAddressFields = [
  "label",
  "fullName",
  "phone",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "country",
] as const;

const allowedAddressFields = new Set([
  ...requiredAddressFields,
  "addressLine2",
  "isDefault",
]);

const getSafeUser = (user: IUser) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  addresses: user.addresses,
});

const validateAddress = (
  body: unknown
): { address?: AddressInput; error?: string } => {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: "Please provide valid address data" };
  }

  const input = body as Record<string, unknown>;
  const unsupportedFields = Object.keys(input).filter(
    (field) => !allowedAddressFields.has(field)
  );

  if (unsupportedFields.length > 0) {
    return { error: "Address contains unsupported fields" };
  }

  for (const field of requiredAddressFields) {
    const value = input[field];

    if (typeof value !== "string" || !value.trim()) {
      return { error: `${field} is required` };
    }
  }

  if (
    input.addressLine2 !== undefined &&
    typeof input.addressLine2 !== "string"
  ) {
    return { error: "addressLine2 must be a string" };
  }

  if (input.isDefault !== undefined && typeof input.isDefault !== "boolean") {
    return { error: "isDefault must be true or false" };
  }

  return {
    address: {
      label: (input.label as string).trim(),
      fullName: (input.fullName as string).trim(),
      phone: (input.phone as string).trim(),
      addressLine1: (input.addressLine1 as string).trim(),
      addressLine2:
        typeof input.addressLine2 === "string"
          ? input.addressLine2.trim()
          : undefined,
      city: (input.city as string).trim(),
      state: (input.state as string).trim(),
      postalCode: (input.postalCode as string).trim(),
      country: (input.country as string).trim(),
      isDefault: input.isDefault === true,
    },
  };
};

const getAuthenticatedUser = (
  req: Request,
  res: Response
): IUser | undefined => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication is required",
    });
    return undefined;
  }

  return req.user;
};

export const addAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req, res);

    if (!user) {
      return;
    }

    const { address, error } = validateAddress(req.body);

    if (!address) {
      res.status(400).json({ success: false, message: error });
      return;
    }

    if (address.isDefault) {
      user.addresses.forEach((existingAddress) => {
        existingAddress.isDefault = false;
      });
    }

    user.addresses.push(address);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: { user: getSafeUser(user) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while adding the address",
    });
  }
};

export const updateAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req, res);

    if (!user) {
      return;
    }

    const { addressId } = req.params;

    if (typeof addressId !== "string" || !Types.ObjectId.isValid(addressId)) {
      res.status(400).json({
        success: false,
        message: "Invalid address id",
      });
      return;
    }

    const addressIndex = user.addresses.findIndex(
      (existingAddress) => String(existingAddress._id) === addressId
    );

    if (addressIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    const { address, error } = validateAddress(req.body);

    if (!address) {
      res.status(400).json({ success: false, message: error });
      return;
    }

    if (address.isDefault) {
      user.addresses.forEach((existingAddress, index) => {
        if (index !== addressIndex) {
          existingAddress.isDefault = false;
        }
      });
    }

    Object.assign(user.addresses[addressIndex], address);
    user.markModified("addresses");
    await user.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: { user: getSafeUser(user) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while updating the address",
    });
  }
};

export const deleteAddress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req, res);

    if (!user) {
      return;
    }

    const { addressId } = req.params;

    if (typeof addressId !== "string" || !Types.ObjectId.isValid(addressId)) {
      res.status(400).json({
        success: false,
        message: "Invalid address id",
      });
      return;
    }

    const addressIndex = user.addresses.findIndex(
      (address) => String(address._id) === addressId
    );

    if (addressIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: { user: getSafeUser(user) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the address",
    });
  }
};

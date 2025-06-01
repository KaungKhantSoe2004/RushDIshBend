import { Response } from "express";
import pgPool from "../../db";

// Utility regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+959\d{9,10}$/;
const passwordRegex = /^.{8,}$/;

export const validateUserCreationInput = async (
  userData: {
    name: string;
    phone_one: string;
    phone_two?: string;
    email?: string;
    address_one?: string;
    address_two?: string;
    password: string;
  },
  res: Response
): Promise<boolean> => {
  console.log(userData);
  const {
    name,
    phone_one,
    phone_two,
    email,
    address_one,
    address_two,
    password,
  } = userData;

  // === Required field validation ===
  if (
    !name ||
    !phone_one ||
    !password ||
    !phone_two ||
    !address_one ||
    !address_two
  ) {
    res.status(400).json({
      success: false,
      message: "All Fields are required",
    });
    return false;
  }

  // === Email format check ===
  if (email && !emailRegex.test(email)) {
    res.status(400).json({ success: false, message: "Invalid email format." });
    return false;
  }

  // === Phone format check ===
  if (!phoneRegex.test(phone_one)) {
    res
      .status(400)
      .json({ success: false, message: "Phone One is invalid format." });
    return false;
  }
  if (phone_two && !phoneRegex.test(phone_two)) {
    res
      .status(400)
      .json({ success: false, message: "Phone Two is invalid format." });
    return false;
  }

  // === Password strength check ===
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters long and contain both letters and numbers.",
    });
    return false;
  }

  // === Uniqueness checks ===
  const existing = await pgPool.query(
    `SELECT * FROM users WHERE name = $1 OR phone_one = $2 OR phone_two = $3 OR email = $4`,
    [name, phone_one, phone_two || null, email || null]
  );

  if (existing.rows.length > 0) {
    const conflict = existing.rows[0];
    if (conflict.name === name) {
      res.status(409).json({ success: false, message: "Name already exists." });
    } else if (conflict.phone_one === phone_one) {
      res
        .status(409)
        .json({ success: false, message: "Phone One already exists." });
    } else if (phone_two && conflict.phone_two === phone_two) {
      res
        .status(409)
        .json({ success: false, message: "Phone Two already exists." });
    } else if (email && conflict.email === email) {
      res
        .status(409)
        .json({ success: false, message: "Email already exists." });
    } else {
      res
        .status(409)
        .json({ success: false, message: "User data already exists." });
    }
    return false;
  }

  return true;
};

import { Response } from "express";
import pgPool from "../../db";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+959\d{9,10}$/;
const passwordRegex = /^.{8,}$/;

const storeCreationValidtion = async (
  storeData: {
    name: string;
    phoneOne: string;
    phoneTwo?: string;
    email: string;
    addressOne: string;
    addressTwo?: string;
    rating: string | number;
    owner: string;
    password: string;
  },
  res: Response
): Promise<boolean> => {
  const {
    name,
    phoneOne,
    phoneTwo,
    email,
    addressOne,
    addressTwo,
    owner,
    rating,
    password,
  } = storeData;
  console.log("user data sent");
  if (
    !name ||
    !email ||
    !phoneOne ||
    !phoneTwo ||
    !addressOne ||
    !addressTwo ||
    !owner ||
    !rating ||
    !rating ||
    !password
  ) {
    res.status(400).json({
      success: false,
      message: "Missing required fields.",
    });
    return false;
  }

  // === Format Checks ===
  if (!emailRegex.test(email)) {
    res.status(400).json({ success: false, message: "Invalid email format." });
    return false;
  }

  if (!phoneRegex.test(phoneOne)) {
    res.status(400).json({ success: false, message: "Phone One is invalid." });
    return false;
  }

  if (phoneTwo && !phoneRegex.test(phoneTwo)) {
    res.status(400).json({ success: false, message: "Phone Two is invalid." });
    return false;
  }

  if (!passwordRegex.test(password)) {
    res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include letters and numbers.",
    });
    return false;
  }

  const existing = await pgPool.query(
    `SELECT * FROM stores WHERE name = $1 OR phone_one = $2 OR phone_two = $3 OR email = $4`,
    [name, phoneOne, phoneTwo || null, email]
  );

  if (existing.rows.length > 0) {
    const conflict = existing.rows[0];
    if (conflict.name === name) {
      res
        .status(409)
        .json({ success: false, message: "Store name already exists." });
    } else if (conflict.phone_one === phoneOne) {
      res
        .status(409)
        .json({ success: false, message: "Phone One already exists." });
    } else if (phoneTwo && conflict.phone_two === phoneTwo) {
      res
        .status(409)
        .json({ success: false, message: "Phone Two already exists." });
    } else if (conflict.email === email) {
      res
        .status(409)
        .json({ success: false, message: "Email already exists." });
    } else {
      res
        .status(409)
        .json({ success: false, message: "Store data already exists." });
    }
    return false;
  }

  return true;
};
export default storeCreationValidtion;

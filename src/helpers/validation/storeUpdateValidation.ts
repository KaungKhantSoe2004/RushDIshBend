import { Response } from "express";
import pgPool from "../../db";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+959\d{9,10}$/;

const storeUpdateValidation = async (
  storeData: {
    id: number;
    name?: string;
    phone_one?: string;
    phone_two?: string;
    email?: string;
    address_one?: string;
    address_two?: string;
    rating?: number | string;
    owner?: string;
  },
  res: Response
): Promise<boolean> => {
  const {
    id,
    name,
    phone_one,
    phone_two,
    email,
    address_one,
    address_two,
    owner,
    rating,
  } = storeData;

  if (
    !id ||
    !name ||
    !email ||
    !phone_one ||
    !phone_two ||
    !address_one ||
    !address_two ||
    !owner ||
    !rating
  ) {
    res.status(400).json({
      success: false,
      message: "Missing required fields.",
    });
    return false;
  }

  if (!id) {
    res.status(400).json({ success: false, message: "Store ID is required." });
    return false;
  }

  // === Format Checks ===
  if (email && !emailRegex.test(email)) {
    res.status(400).json({ success: false, message: "Invalid email format." });
    return false;
  }

  if (phone_one && !phoneRegex.test(phone_one)) {
    res.status(400).json({ success: false, message: "Phone One is invalid." });
    return false;
  }

  if (phone_two && !phoneRegex.test(phone_two)) {
    res.status(400).json({ success: false, message: "Phone Two is invalid." });
    return false;
  }

  if (!address_one) {
    res
      .status(400)
      .json({ success: false, message: "Address one Is required" });
    return false;
  }
  // === Conflict Check ===
  const result = await pgPool.query(
    `
    SELECT * FROM stores 
    WHERE id != $1 AND (
      name = $2 OR 
      phone_one = $3 OR 
      phone_two = $4  
    )
  `,
    [id, name || null, phone_one || null, phone_two || null]
  );

  if (result.rows.length > 0) {
    const conflict = result.rows[0];
    if (name && conflict.name === name) {
      res
        .status(409)
        .json({ success: false, message: "Store name already exists." });
    } else if (phone_one && conflict.phone_one === phone_one) {
      res
        .status(409)
        .json({ success: false, message: "Phone One already exists." });
    } else if (phone_two && conflict.phone_two === phone_two) {
      res
        .status(409)
        .json({ success: false, message: "Phone Two already exists." });
    } else {
      res
        .status(409)
        .json({ success: false, message: "Store data already exists." });
    }
    return false;
  }

  return true;
};

export default storeUpdateValidation;

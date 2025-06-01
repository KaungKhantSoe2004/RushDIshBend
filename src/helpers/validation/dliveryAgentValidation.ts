import { Response } from "express";
import pgPool from "../../db";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+959\d{9,10}$/;
const passwordRegex = /^.{8,}$/;

const validateDeliveryAgentInput = async (
  agentData: {
    name: string;
    phone_one: string;
    phone_two?: string;
    email: string;
    vehicle_type: string;
    vehicle_number: string;
    address_one: string;
    address_two?: string;
    rating: string | number;
    password: string;
    status: string;
  },
  res: Response
): Promise<boolean> => {
  const {
    name,
    phone_one,
    phone_two,
    email,
    vehicle_type,
    vehicle_number,
    address_one,
    address_two,
    rating,
    password,
    status,
  } = agentData;

  if (
    !name ||
    !phone_one ||
    !email ||
    !vehicle_type ||
    !vehicle_number ||
    !address_one ||
    !address_two ||
    !rating ||
    !password
  ) {
    res.status(400).json({
      success: false,
      message: "Missing required fields.",
    });
    return false;
  }

  if (!emailRegex.test(email)) {
    res.status(400).json({ success: false, message: "Invalid email format." });
    return false;
  }

  if (!phoneRegex.test(phone_one)) {
    res.status(400).json({ success: false, message: "Phone One is invalid." });
    return false;
  }

  if (phone_two && !phoneRegex.test(phone_two)) {
    res.status(400).json({ success: false, message: "Phone Two is invalid." });
    return false;
  }

  if (!passwordRegex.test(password)) {
    res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include both letters and numbers.",
    });
    return false;
  }

  const conflictQuery = await pgPool.query(
    `SELECT * FROM delivery_agents WHERE phone_one = $1 OR email = $2`,
    [phone_one, email]
  );

  if (conflictQuery.rows.length > 0) {
    const conflict = conflictQuery.rows[0];
    if (conflict.phone_one === phone_one) {
      res
        .status(409)
        .json({ success: false, message: "Phone One already exists." });
    } else if (conflict.email === email) {
      res
        .status(409)
        .json({ success: false, message: "Email already exists." });
    } else {
      res
        .status(409)
        .json({ success: false, message: "Delivery agent already exists." });
    }
    return false;
  }

  return true;
};
export default validateDeliveryAgentInput;

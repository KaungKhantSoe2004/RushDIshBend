import { Response } from "express";
import pgPool from "../../db";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+959\d{9,10}$/;

const deliveryAgentUpdateValidation = async (
  agentData: {
    id: number;
    name?: string;
    phone_one?: string;
    phone_two?: string;
    email?: string;
    vehicle_type?: string;
    vehicle_number?: string;
    address_one?: string;
    address_two?: string;
    rating?: number | string;
    status: string;
  },
  res: Response
): Promise<boolean> => {
  const {
    id,
    name,
    phone_one,
    phone_two,
    email,
    vehicle_type,
    vehicle_number,
    address_one,
    address_two,
    rating,
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
    !status
  ) {
    res.status(400).json({
      success: false,
      message: "Missing required fields.",
    });
    return false;
  }
  if (!id) {
    res.status(400).json({ success: false, message: "Agent ID is required." });
    return false;
  }

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

  // === Check for conflicts ===
  const result = await pgPool.query(
    `
    SELECT * FROM delivery_agents 
    WHERE id != $1 AND (
      phone_one = $2 OR 
      phone_two = $3 OR 
      email = $4 OR 
      vehicle_number = $5
    )
  `,
    [
      id,
      phone_one || null,
      phone_two || null,
      email || null,
      vehicle_number || null,
    ]
  );

  if (result.rows.length > 0) {
    const conflict = result.rows[0];
    if (conflict.phone_one === phone_one) {
      res
        .status(409)
        .json({ success: false, message: "Phone One already exists." });
    } else if (phone_two && conflict.phone_two === phone_two) {
      res
        .status(409)
        .json({ success: false, message: "Phone Two already exists." });
    } else if (conflict.email === email) {
      res
        .status(409)
        .json({ success: false, message: "Email already exists." });
    } else if (conflict.vehicle_number === vehicle_number) {
      res
        .status(409)
        .json({ success: false, message: "Vehicle number already exists." });
    } else {
      res
        .status(409)
        .json({ success: false, message: "Delivery agent data conflict." });
    }
    return false;
  }

  return true;
};

export default deliveryAgentUpdateValidation;

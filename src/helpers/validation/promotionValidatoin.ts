import { Response } from "express";
import pgPool from "../../db";

export const validatePromotionInput = async (
  promotionData: {
    title: string;
    description: string;
    discount_type: string;
    discount_value: number;
    minimum_spent_price?: number;
    start_date: string;
    end_date: string;
    usage_limit?: number;
    status: string;
  },
  res: Response
): Promise<boolean> => {
  const {
    title,
    description,
    discount_type,
    discount_value,
    minimum_spent_price,
    start_date,
    end_date,
    usage_limit,
    status,
  } = promotionData;

  if (
    !title ||
    !description ||
    !discount_type ||
    discount_value === undefined ||
    !start_date ||
    !end_date ||
    !status
  ) {
    res.status(400).json({
      success: false,
      message:
        "Title, description, discount_type, discount_value, start_date, end_date, and status are required fields",
    });
    return false;
  }

  // === Title validation ===
  if (title.length > 100) {
    res.status(400).json({
      success: false,
      message: "Title must be 100 characters or less",
    });
    return false;
  }

  // === Description validation ===
  if (description.length > 500) {
    res.status(400).json({
      success: false,
      message: "Description must be 500 characters or less",
    });
    return false;
  }

  // === Discount type validation ===
  const validDiscountTypes = [
    "percentage_discount",
    "fixed_amount_discount",
    "coupon_discount",
    "free_delivery_discount",
    "minimum_spend_discount",
  ];

  if (!validDiscountTypes.includes(discount_type)) {
    res.status(400).json({
      success: false,
      message: `Invalid discount type. Must be one of: ${validDiscountTypes.join(", ")}`,
    });
    return false;
  }

  // === Discount value validation ===
  if (isNaN(discount_value)) {
    res.status(400).json({
      success: false,
      message: "Discount value must be a number",
    });
    return false;
  }

  if (
    discount_type === "percentage_discount" &&
    (discount_value <= 0 || discount_value > 100)
  ) {
    res.status(400).json({
      success: false,
      message: "Percentage discount must be between 0 and 100",
    });
    return false;
  }

  if (
    (discount_type === "fixed_amount_discount" ||
      discount_type === "minimum_spend_discount") &&
    discount_value < 0
  ) {
    res.status(400).json({
      success: false,
      message: "Fixed amount discount must be greater than or equal 0",
    });
    return false;
  }

  // === Minimum spent price validation ===
  if (minimum_spent_price !== undefined && minimum_spent_price < 0) {
    res.status(400).json({
      success: false,
      message: "Minimum spent price must be greater than 0 if provided",
    });
    return false;
  }

  // === Date validation ===
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const now = new Date();

  if (isNaN(startDate.getTime())) {
    res.status(400).json({
      success: false,
      message: "Invalid start date format",
    });
    return false;
  }

  if (isNaN(endDate.getTime())) {
    res.status(400).json({
      success: false,
      message: "Invalid end date format",
    });
    return false;
  }

  if (startDate >= endDate) {
    res.status(400).json({
      success: false,
      message: "End date must be after start date",
    });
    return false;
  }

  if (endDate < now) {
    res.status(400).json({
      success: false,
      message: "End date must be in the future",
    });
    return false;
  }

  // === Usage limit validation ===
  if (usage_limit !== undefined && usage_limit < 0) {
    res.status(400).json({
      success: false,
      message: "Usage limit must be lesser than 0 if provided",
    });
    return false;
  }

  // === Status validation ===
  const validStatuses = ["active", "inactive", "expired", "scheduled"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
    return false;
  }

  // === Uniqueness check for title ===
  const existing = await pgPool.query(
    `SELECT * FROM promotions WHERE title = $1`,
    [title]
  );

  if (existing.rows.length > 0) {
    res.status(409).json({
      success: false,
      message: "Promotion with this title already exists",
    });
    return false;
  }

  return true;
};

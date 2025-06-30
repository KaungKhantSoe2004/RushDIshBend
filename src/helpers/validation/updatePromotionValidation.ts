import { Response } from "express";
import pgPool from "../../db";

export const validateUpdatePromotionInput = async (
  promotionData: {
    id: string;
    title?: string;
    description?: string;
    discount_type?: string;
    discount_value?: number;
    minimum_spent_price?: number;
    start_date?: string;
    end_date?: string;
    usage_limit?: number;
    status?: string;
  },
  res: Response
): Promise<boolean> => {
  const {
    id,
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

  // === Validate only provided fields ===

  if (title && title.length > 100) {
    res.status(400).json({
      success: false,
      message: "Title must be 100 characters or less",
    });
    return false;
  }

  if (description && description.length > 500) {
    res.status(400).json({
      success: false,
      message: "Description must be 500 characters or less",
    });
    return false;
  }

  const validDiscountTypes = [
    "percentage_discount",
    "fixed_amount_discount",
    "coupon_discount",
    "free_delivery_discount",
    "minimum_spend_discount",
  ];
  if (discount_type && !validDiscountTypes.includes(discount_type)) {
    res.status(400).json({
      success: false,
      message: `Invalid discount type. Must be one of: ${validDiscountTypes.join(", ")}`,
    });
    return false;
  }

  if (discount_value !== undefined) {
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
        message: "Fixed amount discount must be greater than or equal to 0",
      });
      return false;
    }
  }

  if (minimum_spent_price !== undefined && minimum_spent_price < 0) {
    res.status(400).json({
      success: false,
      message: "Minimum spent price must be greater than 0 if provided",
    });
    return false;
  }

  let startDate: Date | undefined;
  let endDate: Date | undefined;
  const now = new Date();

  if (start_date) {
    startDate = new Date(start_date);
    if (isNaN(startDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid start date format",
      });
      return false;
    }
  }

  if (end_date) {
    endDate = new Date(end_date);
    if (isNaN(endDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid end date format",
      });
      return false;
    }
  }

  if (startDate && endDate && startDate >= endDate) {
    res.status(400).json({
      success: false,
      message: "End date must be after start date",
    });
    return false;
  }

  if (endDate && endDate < now) {
    res.status(400).json({
      success: false,
      message: "End date must be in the future",
    });
    return false;
  }

  if (usage_limit !== undefined && usage_limit < 0) {
    res.status(400).json({
      success: false,
      message: "Usage limit must be greater than or equal to 0 if provided",
    });
    return false;
  }

  const validStatuses = ["active", "inactive", "expired", "scheduled"];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
    return false;
  }

  // === Check uniqueness of title if it’s provided and changed ===
  if (title) {
    const existing = await pgPool.query(
      `SELECT * FROM promotions WHERE title = $1 AND id != $2`,
      [title, id]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: "Another promotion with this title already exists",
      });
      return false;
    }
  }

  return true;
};

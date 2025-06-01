import { response } from "express";
import pgPool from "../../db";

const PhoneValiation = async (
  phone_one: string,
  phone_two: string,
  id: string,
  table: string
): Promise<void> => {
  const phones = await pgPool.query(
    `SELECT * FROM ${table} WHERE phone_one = $1 AND id != $2`,
    [phone_one, id]
  );

  if (phones.rows.length > 0) {
    response.status(401).json({
      message: "Phone Number One already exists",
    });
    return;
  }
  const phonesTwo = await pgPool.query(
    `SELECT * FROM ${table} WHERE phone_two = $1 AND id != $2`,
    [phone_two, id]
  );

  if (phonesTwo.rows.length > 0) {
    response.status(401).json({
      message: "Phone Number Two already exists",
    });
    return;
  }
};
export default PhoneValiation;

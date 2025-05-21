import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const SALT_ROUNDS = 10;
const PEPPER = process.env.SECRET_PEPPER;

export default async function hashPassword(
  plainPassword: string
): Promise<string> {
  const pepperedPassword = plainPassword + PEPPER;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(pepperedPassword, salt);
}

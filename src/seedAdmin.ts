import pgPool from "./db";
import dotenv from "dotenv";
import hashPassword from "./helpers/hashPassword";

dotenv.config();

const seedAdmin = async () => {
  const name = process.env.ADMIN_NAME || "Admin";
  const phoneOne = process.env.ADMIN_PHONE_ONE || "123546";
  const phoneTwo = process.env.ADMIN_PHONE_TWO || "1232324";
  const addressOne = process.env.ADMIN_ADDRESS_ONE || "123 Main St";
  const addressTwo = process.env.ADMIN_ADDRESS_TWO || "456 Elm St";
  const account_status = "active";
  const points = 0;
  const login_code = "1234556";
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const plainPassword = String(process.env.ADMIN_PASSWORD);
  const hashedPassword = await hashPassword(plainPassword);
  const role = "admin";

  try {
    const existing = await pgPool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length === 0) {
      await pgPool.query(
        `INSERT INTO users (name, phone_one, phone_two, email, address_one, address_two, account_status, points, login_code, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8 , $9, $10, $11, $12)`,
        [
          name,
          phoneOne,
          phoneTwo,
          email,
          addressOne,
          addressTwo,
          account_status,
          points,
          login_code,
          hashedPassword,
          role,
          "false",
        ]
      );
      console.log("✅ Admin user created.");
    } else {
      console.log("ℹ️ Admin user already exists.");
    }
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
  }
};

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });

import dotenv from "dotenv";
import hashPassword from "../helpers/hashPassword";
import pgPool from "../db";

dotenv.config();
interface eachUserType {
  name: string;
  phone_one: string;
  phone_two: string;
  email: string;
  address_one: string;
  address_two: string;
  password: string;
  account_status: string;
  login_code: string;
  role: string;
}

const seedAdmin = async (): Promise<void> => {
  const users: Array<eachUserType> = [
    {
      name: "Kay Khaing Thu",
      phone_one: "0911111111",
      phone_two: "0922222222",
      email: "kaykhaing@gmail.com",
      address_one: "123 Main St, Yangon",
      address_two: "Room 101, Building A",
      password: "kkt2004",
      account_status: "active",
      login_code: "2343434",
      role: "user",
    },
    {
      name: "Htet Htet Khaing",
      phone_one: "09876879",
      phone_two: "0944444444",
      email: "htethtet@gmail.com",
      address_one: "456 Mandalay Rd, Mandalay",
      address_two: "2nd Floor, Block B",
      password: "hhk2004",
      account_status: "active",
      login_code: "2343434",
      role: "admin",
    },
    {
      name: "Vivian",
      phone_one: "0955555555",
      phone_two: "0966666666",
      email: "vivian@gmail.com",
      address_one: "789 Capital Ave, Nay Pyi Taw",
      address_two: "Suite 3C, Tower C",
      password: "vivian2004",
      account_status: "active",
      login_code: "2343434",
      role: "user",
    },
  ];

  try {
    for (const user of users) {
      const hashedPassword = await hashPassword(user.password);
      const existing = await pgPool.query(
        "SELECT * FROM users WHERE email = $1",
        [user.email]
      );

      if (existing.rows.length === 0) {
        await pgPool.query(
          `INSERT INTO users (name, phone_one, phone_two, email, address_one, address_two,
           account_status, points, login_code, password_hash, role, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8 , $9, $10, $11, $12)`,
          [
            user.name,
            user.phone_one,
            user.phone_two,
            user.email,
            user.address_one,
            user.address_two,
            user.account_status,
            0,
            user.login_code,
            hashedPassword,
            user.role,
            "false",
          ]
        );
        console.log("✅ user created.");
      } else {
        console.log("ℹ️  user already exists.");
      }
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

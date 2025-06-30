import hashPassword from "../helpers/hashPassword";
import pgPool from "../db";

const seedStores = async () => {
  const stores = [
    {
      name: "Store One",
      phone_one: "0911111111",
      phone_two: "0922222222",
      email: "store1@example.com",
      address_one: "123 Main St, Yangon",
      address_two: "Room 101, Building A",
      password: "store1pass",
      owner: "Kaung Khant Soe",
    },
    {
      name: "Store Two",
      phone_one: "0933333333",
      phone_two: "0944444444",
      email: "store2@example.com",
      address_one: "456 Mandalay Rd, Mandalay",
      address_two: "2nd Floor, Block B",
      password: "store2pass",
      owner: "Htet Htet Khaing",
    },
    {
      name: "Store Three",
      phone_one: "0955555555",
      phone_two: "0966666666",
      email: "store3@example.com",
      address_one: "789 Capital Ave, Nay Pyi Taw",
      address_two: "Suite 3C, Tower C",
      password: "store3pass",
      owner: "May Thet Swe",
    },
  ];

  for (const store of stores) {
    const existing = await pgPool.query(
      "SELECT * FROM stores WHERE phone_one = $1",
      [store.phone_one]
    );

    if (existing.rows.length === 0) {
      const hashedPassword = await hashPassword(store.password);
      console.log(hashedPassword, "is hashedPassword");
      await pgPool.query(
        `INSERT INTO stores (
          name, phone_one, phone_two, email, address_one, address_two,
          account_status, password_hash, role, owner
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          store.name,
          store.phone_one,
          store.phone_two,
          store.email,
          store.address_one,
          store.address_two,
          "active",
          hashedPassword,
          "store",
          store.owner,
        ]
      );
      console.log(`✅ Store ${store.name} created.`);
    } else {
      console.log(`ℹ️ Store ${store.name} already exists.`);
    }
  }
};

seedStores()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Stores Seed failed:", err);
    process.exit(1);
  });

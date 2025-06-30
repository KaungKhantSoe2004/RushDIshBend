import dotenv from "dotenv";
import pgPool from "../db";

dotenv.config();

interface MenuItemType {
  store_id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  is_available?: boolean;
}

const seedMenus = async (): Promise<void> => {
  const menuItems: Array<MenuItemType> = [
    {
      store_id: 1,
      name: "Margherita Pizza",
      description: "Classic pizza with tomato sauce, mozzarella, and basil",
      price: 8.99,
      category: "Pizza",
      image: "https://example.com/margherita.jpg",
    },
    {
      store_id: 1,
      name: "Pepperoni Pizza",
      description: "Topped with spicy pepperoni and cheese",
      price: 9.99,
      category: "Pizza",
      image: "https://example.com/pepperoni.jpg",
    },
    {
      store_id: 2,
      name: "Salmon Roll",
      description: "Fresh salmon wrapped in seaweed and rice",
      price: 12.5,
      category: "Sushi",
      image: "https://example.com/salmonroll.jpg",
    },
  ];

  try {
    for (const item of menuItems) {
      const exists = await pgPool.query(
        "SELECT * FROM menu WHERE name = $1 AND store_id = $2",
        [item.name, item.store_id]
      );

      if (exists.rows.length === 0) {
        await pgPool.query(
          `INSERT INTO menu 
          (store_id, name, description, price, category, image, is_available)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            item.store_id,
            item.name,
            item.description,
            item.price,
            item.category,
            item.image,
            item.is_available ?? true,
          ]
        );
        console.log(`✅ Menu item "${item.name}" created.`);
      } else {
        console.log(`ℹ️  Menu item "${item.name}" already exists.`);
      }
    }
  } catch (err) {
    console.error("❌ Error seeding menus:", err);
  }
};

seedMenus()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });

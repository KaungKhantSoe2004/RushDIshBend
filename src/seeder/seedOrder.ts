import pgPool from "../db";

const DELIVERY_FEE = 2500;

const getRandomDateWithin7Days = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 7);
  now.setDate(now.getDate() - daysAgo);
  return now;
};

const getRandomItems = (count: number = 2) => {
  const itemCatalog = [
    { name: "Burger", price: 3000 },
    { name: "Pizza", price: 5000 },
    { name: "Milk Tea", price: 1500 },
    { name: "Fries", price: 2000 },
    { name: "Coffee", price: 2500 },
  ];

  const items = [];
  for (let i = 0; i < count; i++) {
    const item = itemCatalog[Math.floor(Math.random() * itemCatalog.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;

    items.push({
      name: item.name,
      image:
        "https://th.bing.com/th/id/OIP.xEGSC68jWmo76beXjrvP4wHaHa?w=172&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      notes: "Hello Bro",
      price: item.price,
      quantity,
    });
  }

  return items;
};

const calculateTotalAmount = (items: any[]): number => {
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return DELIVERY_FEE + itemsTotal;
};

const seedOrders = async () => {
  try {
    const users: any = await pgPool.query("SELECT id FROM users LIMIT 3");
    const stores: any = await pgPool.query("SELECT id FROM stores LIMIT 3");
    const agents: any = await pgPool.query(
      "SELECT id FROM delivery_agents LIMIT 3"
    );
    const promotions: any = await pgPool.query(
      "SELECT id FROM promotions LIMIT 3"
    );

    if (users.rowCount < 3 || stores.rowCount < 3 || agents.rowCount < 3) {
      console.error("Not enough users, stores, or agents to seed orders.");
      return;
    }

    const orders: any[] = [];

    // Seed 3 sample orders
    for (let i = 0; i < 3; i++) {
      const createdAt = getRandomDateWithin7Days();
      const items = getRandomItems(Math.floor(Math.random() * 3) + 2); // 2–4 items
      const totalAmount = calculateTotalAmount(items);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      orders.push({
        store_id: "1",
        user_id: users.rows[i].id,
        delivery_id: agents.rows[i].id,
        items: JSON.stringify(items),
        item_count: itemCount,
        total_amount: totalAmount,
        pickup_time: new Date(),
        is_paid: i % 2 === 0,
        address:
          i === 0
            ? "No. 1, Myay Ni Gone, Yangon"
            : i === 1
              ? "45th Street, Mandalay"
              : "Nay Pyi Taw Zone 1",
        instuctions:
          i === 0
            ? "Call when arrived"
            : i === 1
              ? "Ring the doorbell"
              : "Leave at gate",
        customer_pickup_time: new Date(),
        promotion_id: promotions.rows[i]?.id || null,
        status: ["pending", "pending", "delivered"][i],
        created_at: createdAt,
      });
    }

    // Add 20 more orders for store_id = 1
    for (let i = 0; i < 20; i++) {
      const createdAt = getRandomDateWithin7Days();
      const items = getRandomItems(Math.floor(Math.random() * 3) + 2);
      const totalAmount = calculateTotalAmount(items);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      orders.push({
        store_id: 1,
        user_id: users.rows[i % users.rowCount].id,
        delivery_id: agents.rows[i % agents.rowCount].id,
        items: JSON.stringify(items),
        item_count: itemCount,
        total_amount: totalAmount,
        pickup_time: createdAt,
        is_paid: i % 2 === 0,
        address: `Street ${i + 10}, City`,
        instuctions: "Handle with care",
        customer_pickup_time: createdAt,
        promotion_id: promotions.rows[i % promotions.rowCount]?.id || null,
        status: ["pending", "ready", "delivered"][i % 3],
        created_at: createdAt,
      });
    }

    for (const order of orders) {
      await pgPool.query(
        `INSERT INTO orders
        (store_id, user_id, delivery_id, items, item_count, total_amount, pickup_time, is_paid, address, instuctions, customer_pickup_time, promotion_id, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          order.store_id,
          order.user_id,
          order.delivery_id,
          order.items,
          order.item_count,
          order.total_amount,
          order.pickup_time,
          order.is_paid,
          order.address,
          order.instuctions,
          order.customer_pickup_time,
          order.promotion_id,
          order.status,
          order.created_at,
        ]
      );
      console.log(`✅ Order for user ${order.user_id} created.`);
    }
  } catch (err) {
    console.error("❌ Error seeding orders:", err);
  }
};

seedOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

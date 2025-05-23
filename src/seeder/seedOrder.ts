import pgPool from "../db";

const seedOrders = async () => {
  try {
    // Fetch IDs for users, stores, delivery agents, promotions
    const users: Array<{ id: number }> | any = await pgPool.query(
      "SELECT id FROM users LIMIT 3"
    );
    const stores: Array<{ id: number }> | any = await pgPool.query(
      "SELECT id FROM stores LIMIT 3"
    );
    const agents: Array<{ id: number }> | any = await pgPool.query(
      "SELECT id FROM delivery_agents LIMIT 3"
    );
    const promotions: Array<{ id: number }> | any = await pgPool.query(
      "SELECT id FROM promotions LIMIT 3"
    );
    
    // If not enough data to seed orders, exit early
    if (users.rowCount < 3 || stores.rowCount < 3 || agents.rowCount < 3) {
      console.error("Not enough users, stores, or agents to seed orders.");
      return;
    }

    const orders = [
      {
        store_id: stores.rows[0].id,
        user_id: users.rows[0].id,
        delivery_id: agents.rows[0].id,
        items: JSON.stringify([{ name: "Burger", quantity: 2 }]),
        item_count: 2,
        total_amount: 15000.0,
        pickup_time: new Date(),
        is_paid: true,
        address: "No. 1, Myay Ni Gone, Yangon",
        instuctions: "Call when arrived",
        customer_pickup_time: new Date(),
        promotion_id: promotions.rows[0]?.id || null,
        status: "pending",
      },
      {
        store_id: stores.rows[1].id,
        user_id: users.rows[1].id,
        delivery_id: agents.rows[1].id,
        items: JSON.stringify([{ name: "Pizza", quantity: 1 }]),
        item_count: 1,
        total_amount: 18000.0,
        pickup_time: new Date(),
        is_paid: false,
        address: "45th Street, Mandalay",
        instuctions: "Ring the doorbell",
        customer_pickup_time: new Date(),
        promotion_id: promotions.rows[1]?.id || null,
        status: "in_progress",
      },
      {
        store_id: stores.rows[2].id,
        user_id: users.rows[2].id,
        delivery_id: agents.rows[2].id,
        items: JSON.stringify([{ name: "Milk Tea", quantity: 3 }]),
        item_count: 3,
        total_amount: 9000.0,
        pickup_time: new Date(),
        is_paid: true,
        address: "Nay Pyi Taw Zone 1",
        instuctions: "Leave at gate",
        customer_pickup_time: new Date(),
        promotion_id: promotions.rows[2]?.id || null,
        status: "delivered",
      },
    ];

    for (const order of orders) {
      await pgPool.query(
        `INSERT INTO orders
        (store_id, user_id, delivery_id, items, item_count, total_amount, pickup_time, is_paid, address, instuctions, customer_pickup_time, promotion_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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

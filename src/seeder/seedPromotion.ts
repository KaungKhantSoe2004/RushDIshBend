// Make sure this points to your DB pool module

import pgPool from "../db";

const seedPromotions = async () => {
  const promotions = [
    {
      title: "10% Off All Orders",
      description: "Enjoy 10% off your total order amount.",
      discount_type: "percentage",
      discount_value: 10.0,
      min_order_amount: 0.0,
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      usage_limit: 100,
      status: "active",
    },
    {
      title: "Kyats 1000 Off",
      description: "Get 1000Ks off for orders over 5000Ks.",
      discount_type: "fixed",
      discount_value: 1000.0,
      min_order_amount: 5000.0,
      start_date: new Date(),
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      usage_limit: 50,
      status: "active",
    },
    {
      title: "Weekend Special",
      description: "15% off on all weekend orders.",
      discount_type: "percentage",
      discount_value: 15.0,
      min_order_amount: 3000.0,
      start_date: new Date(),
      end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      usage_limit: 200,
      status: "active",
    },
  ];

  for (const promo of promotions) {
    const exists = await pgPool.query(
      "SELECT * FROM promotions WHERE title = $1",
      [promo.title]
    );

    if (exists.rows.length === 0) {
      await pgPool.query(
        `INSERT INTO promotions 
          (title, description, discount_type, discount_value, min_order_amount, start_date, end_date, usage_limit, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          promo.title,
          promo.description,
          promo.discount_type,
          promo.discount_value,
          promo.min_order_amount,
          promo.start_date,
          promo.end_date,
          promo.usage_limit,
          promo.status,
        ]
      );
      console.log(`✅ Promotion "${promo.title}" created.`);
    } else {
      console.log(`ℹ️ Promotion "${promo.title}" already exists.`);
    }
  }
};

seedPromotions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error, "is error");
    process.exit(1);
  });

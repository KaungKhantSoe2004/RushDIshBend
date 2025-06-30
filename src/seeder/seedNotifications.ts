import pgPool from "../db";

const seedNotifications = async () => {
  const notifications = [
    {
      noti_type: "order",
      user_id: 1,
      message: "Your order #1234 has been shipped.",
      status: "unread",
      recipient: "customer",
    },
    {
      noti_type: "promo",
      user_id: 2,
      message: "🔥 Get 20% off your next order with code PROMO20!",
      status: "unread",
      recipient: "customer",
    },
    {
      noti_type: "system",
      user_id: 3,
      message: "📢 Scheduled maintenance on June 5, 2AM - 4AM.",
      status: "read",
      recipient: "all",
    },
  ];

  for (const noti of notifications) {
    try {
      const existing = await pgPool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND message = $2",
        [noti.user_id, noti.message]
      );

      if (existing.rows.length === 0) {
        await pgPool.query(
          `INSERT INTO notifications (
            noti_type, user_id, message, status, recipient
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            noti.noti_type,
            noti.user_id,
            noti.message,
            noti.status,
            noti.recipient,
          ]
        );

        console.log(
          `✅ Notification "${noti.message}" created for user ${noti.user_id}.`
        );
      } else {
        console.log(`ℹ️ Notification for user ${noti.user_id} already exists.`);
      }
    } catch (err) {
      console.error(
        `❌ Failed to insert notification for user ${noti.user_id}:`,
        err
      );
    }
  }
};

seedNotifications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

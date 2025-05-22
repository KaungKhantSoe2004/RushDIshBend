import pgPool from "../db";
import hashPassword from "../helpers/hashPassword";

const seedDeliveryAgents = async () => {
  const agents = [
    {
      name: "Agent One",
      phone_one: "0911111111",
      phone_two: "0922222222",
      email: "agent1@example.com",
      profile: "agent1.jpg",
      vehicle_type: "Motorbike",
      vehicle_number: "YGN-1234",
      address_one: "No. 10, Yangon",
      address_two: "Room A1",
      password: "agent1pass",
    },
    {
      name: "Agent Two",
      phone_one: "0933333333",
      phone_two: "0944444444",
      email: "agent2@example.com",
      profile: "agent2.jpg",
      vehicle_type: "Car",
      vehicle_number: "MDY-5678",
      address_one: "No. 20, Mandalay",
      address_two: "Flat B2",
      password: "agent2pass",
    },
    {
      name: "Agent Three",
      phone_one: "0955555555",
      phone_two: "0966666666",
      email: "agent3@example.com",
      profile: "agent3.jpg",
      vehicle_type: "Bicycle",
      vehicle_number: "NPT-9012",
      address_one: "No. 30, Nay Pyi Taw",
      address_two: "Unit C3",
      password: "agent3pass",
    },
  ];

  for (const agent of agents) {
    const existing = await pgPool.query(
      "SELECT * FROM delivery_agents WHERE phone_one = $1 OR email = $2",
      [agent.phone_one, agent.email]
    );

    if (existing.rows.length === 0) {
      const hashedPassword = hashPassword(agent.password);

      await pgPool.query(
        `INSERT INTO delivery_agents (
          name, phone_one, phone_two, email, profile,
          vehicle_type, vehicle_number, address_one, address_two,
          account_status, points, login_code, password_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          agent.name,
          agent.phone_one,
          agent.phone_two,
          agent.email,
          agent.profile,
          agent.vehicle_type,
          agent.vehicle_number,
          agent.address_one,
          agent.address_two,
          "active",
          0, // points
          "123456", // login code
          hashedPassword,
        ]
      );

      console.log(`✅ Delivery agent ${agent.name} created.`);
    } else {
      console.log(`ℹ️ Delivery agent ${agent.name} already exists.`);
    }
  }
};

seedDeliveryAgents()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

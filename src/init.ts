import pgPool from "./db";

import CreateDeliveryAgentTable from "./sql/createDelivery";
import CreateOrdersTable from "./sql/createOrders";
import CreatePromotionTable from "./sql/createPromotion";
import CreateRatingsTable from "./sql/createRatings";
import CreateReportTable from "./sql/createReports";
import CreateStoresTable from "./sql/createStores";
import CreateUsersTable from "./sql/createUsers";

const runMigrations = async (): Promise<void> => {
  try {
    await pgPool.query(CreateUsersTable);
    console.log("Users Table Created Sucessfully");

    await pgPool.query(CreatePromotionTable);
    console.log("Promotion Table Created Successfully");

    await pgPool.query(CreateDeliveryAgentTable);
    console.log("Delivery Agent Table Created Successfully");

    await pgPool.query(CreateStoresTable);
    console.log("Stores Table Created Successfully");

    await pgPool.query(CreateRatingsTable);
    console.log("Ratings Table Created Successfully");

    await pgPool.query(CreatePromotionTable);
    console.log("Promotion Table Created Successfully");

    await pgPool.query(CreateOrdersTable);
    console.log("Orders Table Created Successfully");

    await pgPool.query(CreateReportTable);
    console.log("Report Table Created Successfully");
  } catch (err: any) {
    console.log(err, "is error");
  }
};
// export default runMigrations;
//
runMigrations();

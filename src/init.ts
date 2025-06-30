import pgPool from "./db";
import createActivityTable from "./sql/createActivity";

import CreateDeliveryAgentTable from "./sql/createDelivery";
import createNotesTable from "./sql/createNote";
import createNotificationsTable from "./sql/createNotification";
import CreateOrdersTable from "./sql/createOrders";
import CreatePromotionTable from "./sql/createPromotion";
import CreateRatingsTable from "./sql/createRatings";
import CreateReportTable from "./sql/createReports";
import CreateStoresTable from "./sql/createStores";
import CreateUsersTable from "./sql/createUsers";
import CreateMenuTable from "./sql/createMenu";
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

    await pgPool.query(createActivityTable);
    console.log("Activity table created successfully");

    await pgPool.query(createNotesTable);
    console.log("Notes Table Created Successfully");

    await pgPool.query(createNotificationsTable);
    console.log("Notifications Table Created Successfully");

    await pgPool.query(CreateMenuTable);
    console.log("Menu Table Created Successfully");
  } catch (err: any) {
    console.log(err, "is error");
  }
};
// export default runMigrations;
//
runMigrations();

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import pgPool from "./db";
import StoreRouter from "./routes/stores";
import ChatRouter from "./routes/chat";
import DeliveryRouter from "./routes/delivery";
import NotificationRouter from "./routes/notification";
import OrderRouter from "./routes/orders";
import PaymentRouter from "./routes/payment";
import PromotionRouter from "./routes/promotion";
import RatingRouter from "./routes/rating";
import ReportRouter from "./routes/reports";
dotenv.config();
const app = express();
const mongourl: string | undefined = process.env.MONGO_URL;
const PORT: number | undefined = Number(process.env.PORT);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
if (!mongourl) {
  throw new Error("MONGO_URL does not exist");
}

app.get("/", (req, res) => {
  res.send("Hello world Backend");
});

app.use("/api/stores", StoreRouter);
app.use("/api/chat", ChatRouter);
app.use("/api/delivery", DeliveryRouter);
app.use("/api/notification", NotificationRouter);
app.use("/api/order", OrderRouter);
app.use("/api/payment", PaymentRouter);
app.use("/api/promotion", PromotionRouter);
app.use("/api/rating", RatingRouter);
app.use("/api/report", ReportRouter);

mongoose
  .connect(mongourl)
  .then(async () => {
    console.log("Connected to MongDB");
    try {
      const result = await pgPool.query("SELECT NOW()");
      console.log("✅ Connected to PostgreSQL at", result.rows[0].now);
      app.listen(PORT, () => {
        console.log(`Server is running on port http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error("❌ PostgreSQL connection error:", err);
    }
  })
  .catch((err) => console.log(err));

import express from "express";
import dotenv from "dotenv";
import cors, { CorsOptions } from "cors";
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
import UserRouter from "./routes/user";
import AdminRouter from "./routes/admin";
import cookieParser from "cookie-parser";
dotenv.config();
const app = express();
const mongourl: string | undefined = process.env.MONGO_URL;
const PORT: number | undefined = Number(process.env.PORT);
const allowedOrigins = [
  "http://admin.localhost:5173",
  "http://user.localhost:5173",
  "https://admin.yourdomain.com",
  "https://yourdomain.com",
];

// Properly typed CORS options
// const corsOptions: CorsOptions = {
//   origin: (
//     requestOrigin: string | undefined,
//     callback: (
//       err: Error | null,
//       origin?: boolean | string | RegExp | (boolean | string | RegExp)[]
//     ) => void
//   ) => {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));
app.use(
  cors({
    origin: "http://localhost:5173", // allow Vite frontend
    credentials: true, // if using cookies or authorization headers
  })
);
app.use(cookieParser());
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
app.use("/api/admin/", AdminRouter);
app.use("/api/user", UserRouter);

mongoose
  .connect(mongourl)
  .then(async () => {
    console.log("Connected to MongDB");
    try {
      const result = await pgPool.query("SELECT * FROM users");
      console.log("✅ Connected to PostgreSQL ");
      app.listen(PORT, () => {
        console.log(`Server is running on port http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error("❌ PostgreSQL connection error:", err);
    }
  })
  .catch((err) => console.log(err));

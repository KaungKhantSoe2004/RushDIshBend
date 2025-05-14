import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
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

mongoose
  .connect(mongourl)
  .then(() => {
    console.log("Connected to MongDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.log(err));

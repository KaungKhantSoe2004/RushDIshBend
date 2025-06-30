import express, { Router, Request, Response } from "express";
import StoreController from "../controllers/storeController";
import verifyToken from "../helpers/verifyToken";
import { uploadSingle } from "../helpers/upload";
import AdminController from "../controllers/adminController";
const StoreRouter: Router = express.Router();

StoreRouter.post("/storeLogin", async (req: Request, res: Response) => {
  StoreController.storeLogin(req, res);
});
StoreRouter.get("/me", verifyToken, async (req: Request, res: Response) => {
  await StoreController.me(req, res);
});
StoreRouter.get(
  "/dashboard",
  verifyToken,
  async (req: Request, res: Response) => {
    StoreController.storeDashboard(req, res);
  }
);
StoreRouter.get("/profile", verifyToken, (req: Request, res: Response) => {
  StoreController.profileDetails(req, res);
});
StoreRouter.post(
  "/updateProfile",
  verifyToken,
  uploadSingle("profile"),
  (req, res) => {
    StoreController.updateProfile(req, res);
  }
);
StoreRouter.get("/logout", verifyToken, async (req: Request, res: Response) => {
  await AdminController.logout(req, res);
});
export default StoreRouter;

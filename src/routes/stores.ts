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
  "/storemenu",
  verifyToken,
  async (req: Request, res: Response) => {
    await StoreController.storemenu(req, res);
  }
);
StoreRouter.get(
  "/dashboard",
  verifyToken,
  async (req: Request, res: Response) => {
    StoreController.storeDashboard(req, res);
  }
);
StoreRouter.get(
  "/orderList",
  verifyToken,
  async (req: Request, res: Response) => {
    StoreController.storeOrder(req, res);
  }
);
StoreRouter.get("/profile", verifyToken, (req: Request, res: Response) => {
  StoreController.profileDetails(req, res);
});
StoreRouter.post(
  "/addStoreCategory",
  verifyToken,
  uploadSingle("profile"),
  (req: Request, res: Response) => {
    StoreController.addStoreCategory(req, res);
  }
);
StoreRouter.post(
  "/updateStoreCategory",
  verifyToken,
  uploadSingle("profile"),
  (req: Request, res: Response) => {
    StoreController.updateStoreCategory(req, res);
  }
);
StoreRouter.delete(
  "/deleteStoreCategory/:id",
  verifyToken,
  (req: Request, res: Response) => {
    StoreController.deleteStoreCategory(req, res);
  }
);
StoreRouter.post(
  "/addMenu",
  verifyToken,
  uploadSingle("image"),
  (req: Request, res: Response) => {
    StoreController.addMenu(req, res);
  }
);
StoreRouter.post(
  "/updateMenu",
  verifyToken,
  uploadSingle("image"),
  (req: Request, res: Response) => {
    StoreController.updateMenu(req, res);
  }
);
StoreRouter.delete(
  "/destroyMenu/:id",
  verifyToken,
  (req: Request, res: Response) => {
    StoreController.destoryMenu(req, res);
  }
);
StoreRouter.post(
  "/updateProfile",
  verifyToken,
  uploadSingle("image"),
  (req, res) => {
    StoreController.updateProfile(req, res);
  }
);
StoreRouter.post(
  "/orders/:id/:action",
  verifyToken,
  (req: Request, res: Response) => {
    StoreController.setOrderStatusChange(req, res);
  }
);
StoreRouter.get(
  "/storePromotion",
  verifyToken,
  (req: Request, res: Response) => {
    StoreController.storePromotion(req, res);
  }
);
StoreRouter.post(
  `/addPromotionToStore/:id`,
  verifyToken,
  (req: Request, res: Response) => {
    StoreController.addPromotionToStore(req, res);
  }
);
StoreRouter.post(
  `/removePromotion/:id`,
  verifyToken,
  (req: Request, res: Response) => {
    StoreController.removePromotion(req, res);
  }
);
StoreRouter.get("/logout", verifyToken, async (req: Request, res: Response) => {
  await AdminController.logout(req, res);
});
export default StoreRouter;

import express, { Router, Request, Response } from "express";
import UserController from "../controllers/userController";
import AdminController from "../controllers/adminController";
import verifyToken from "../helpers/verifyToken";
import { verify } from "crypto";
import { uploadSingle } from "../helpers/upload";

const AdminRouter: Router = express.Router();

// admin panel admin role start
AdminRouter.get("/getUser", async (req: Request, res: Response) => {
  UserController.userLogin(req, res);
});
AdminRouter.post(
  "/adminLogin",

  async (req: Request, res: Response) => {
    AdminController.adminLogin(req, res);
  }
);
AdminRouter.get(
  "/dashboard",
  verifyToken,
  async (req: Request, res: Response) => {
    AdminController.adminDashboard(req, res);
  }
);
AdminRouter.get("/me", verifyToken, async (req: Request, res: Response) => {
  await AdminController.me(req, res);
});
AdminRouter.get("/logout", verifyToken, async (req: Request, res: Response) => {
  await AdminController.logout(req, res);
});
AdminRouter.get("/stores", verifyToken, async (req: Request, res: Response) => {
  AdminController.adminStore(req, res);
});
AdminRouter.post(
  "/addStore",
  uploadSingle("storeLogo"),
  async (req: Request, res: Response) => {
    AdminController.storeCreate(req, res);
  }
);
AdminRouter.put(
  "/storeStatus",
  verifyToken,
  async (req: Request, res: Response) => {
    AdminController.storeStatus(req, res);
  }
);
AdminRouter.get(
  "/eachStore/:id",
  verifyToken,
  async (req: Request, res: Response) => {
    AdminController.eachStore(req, res);
  }
);
AdminRouter.post(
  "/updateStore",
  verifyToken,
  uploadSingle("storeLogo"),
  (req: Request, res: Response) => {
    AdminController.updateStore(req, res);
  }
);
AdminRouter.delete(
  "/deleteStore/:id",
  verifyToken,
  (req: Request, res: Response) => {
    AdminController.deleteStore(req, res);
  }
);
AdminRouter.get(
  "/delivery",
  verifyToken,
  async (req: Request, res: Response) => {
    AdminController.adminDelivery(req, res);
  }
);
AdminRouter.post(
  "/addDelivery",
  verifyToken,
  uploadSingle("profile"),
  async (req: Request, res: Response) => {
    AdminController.deliveryCreate(req, res);
  }
);
AdminRouter.get(
  "/eachDelivery/:id",
  verifyToken,
  async (req: Request, res: Response) => {
    AdminController.eachDelivery(req, res);
  }
);
AdminRouter.post(
  "/updateDelivery",
  verifyToken,
  uploadSingle("profile"),
  async (req: Request, res: Response) => {
    AdminController.updateDelivery(req, res);
  }
);
AdminRouter.get(
  "/orderList",
  verifyToken,
  async (req: Request, res: Response) => {
    AdminController.adminOrderList(req, res);
  }
);
AdminRouter.get(
  "/userList",
  verifyToken,
  async (req: Request, res: Response) => {
    AdminController.adminUserList(req, res);
  }
);
AdminRouter.post(
  "/addUser",
  verifyToken,
  uploadSingle("profile"),
  async (req: Request, res: Response) => {
    AdminController.adduser(req, res);
  }
);
AdminRouter.post(
  "/updateUser",
  verifyToken,
  async (req: Request, res: Response) => {
    AdminController.updateUser;
  }
);
AdminRouter.get("/eachUser/:id", verifyToken, (req: Request, res: Response) => {
  AdminController.eachUser(req, res);
});
export default AdminRouter;

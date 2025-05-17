import express, { Router, Request, Response } from "express";
import UserController from "../controllers/userController";
import StoreController from "../controllers/storeController";
import DeliveryController from "../controllers/deliveryController";
const UserRouter: Router = express.Router();

// admin panel admin role start
UserRouter.get("getUser", async (req: Request, res: Response) => {
  UserController.index(req, res);
});
UserRouter.post("adminLogin", async (req: Request, res: Response) => {
  UserController.adminLogin(req, res);
});

// admin panel admin role end

// store_agent panel role start
UserRouter.post("storeLogin", async (req: Request, res: Response) => {
  StoreController.index(req, res);
});

// store_agent panel role end

// delivery_agent panel role start
UserRouter.post("deliverylogin", async (req: Request, res: Response) => {
  DeliveryController.index(req, res);
});
export default UserRouter;

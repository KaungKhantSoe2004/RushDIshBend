import express, { Router, Request, Response } from "express";
import UserController from "../controllers/userController";
import StoreController from "../controllers/storeController";
import DeliveryController from "../controllers/deliveryController";
import AdminController from "../controllers/adminController";
const UserRouter: Router = express.Router();

// admin panel admin role start
UserRouter.get("getUser", async (req: Request, res: Response) => {
  UserController.userLogin(req, res);
});

export default UserRouter;

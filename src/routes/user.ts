import express, { Router, Request, Response } from "express";
import UserController from "../controllers/userController";
const UserRouter: Router = express.Router();

UserRouter.get("getStores", async (req: Request, res: Response) => {
  UserController.index(req, res);
});

export default UserRouter;

import express, { Router, Request, Response } from "express";
import NotificationController from "../controllers/notificationController";
const NotificationRouter: Router = express.Router();

NotificationRouter.get("getStores", async (req: Request, res: Response) => {
  NotificationController.index(req, res);
});

export default NotificationRouter;

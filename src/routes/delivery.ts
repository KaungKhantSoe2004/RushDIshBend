import express, { Router, Request, Response } from "express";
import DeliveryController from "../controllers/deliveryController";
const DeliveryRouter: Router = express.Router();

DeliveryRouter.get("getStores", async (req: Request, res: Response) => {
  DeliveryController.index(req, res);
});

export default DeliveryRouter;

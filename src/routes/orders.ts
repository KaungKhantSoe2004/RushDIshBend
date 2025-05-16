import express, { Router, Request, Response } from "express";
import OrderController from "../controllers/orderController";
const OrderRouter: Router = express.Router();

OrderRouter.get("getStores", async (req: Request, res: Response) => {
  OrderController.index(req, res);
});

export default OrderRouter;

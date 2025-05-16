import express, { Router, Request, Response } from "express";
import PaymentController from "../controllers/paymentController";
const PaymentRouter: Router = express.Router();

PaymentRouter.get("getStores", async (req: Request, res: Response) => {
  PaymentController.index(req, res);
});

export default PaymentRouter;

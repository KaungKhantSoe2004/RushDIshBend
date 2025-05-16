import express, { Router, Request, Response } from "express";
import PromotionController from "../controllers/promotionController";
const PromotionRouter: Router = express.Router();

PromotionRouter.get("getStores", async (req: Request, res: Response) => {
  PromotionController.index(req, res);
});

export default PromotionRouter;

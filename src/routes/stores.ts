import express, { Router, Request, Response } from "express";
import StoreController from "../controllers/storeController";
const StoreRouter: Router = express.Router();

StoreRouter.get("getStores", async (req: Request, res: Response) => {
  StoreController.index(req, res);
});

export default StoreRouter;

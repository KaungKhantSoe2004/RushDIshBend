import express, { Router, Request, Response } from "express";
import RatingController from "../controllers/ratingController";
const RatingRouter: Router = express.Router();

RatingRouter.get("getStores", async (req: Request, res: Response) => {
  RatingController.index(req, res);
});

export default RatingRouter;

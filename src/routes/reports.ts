import express, { Router, Request, Response } from "express";
import ReportController from "../controllers/reportController";
const ReportRouter: Router = express.Router();

ReportRouter.get("getStores", async (req: Request, res: Response) => {
  ReportController.index(req, res);
});

export default ReportRouter;

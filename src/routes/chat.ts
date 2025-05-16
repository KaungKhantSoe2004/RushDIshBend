import express, { Router, Request, Response } from "express";
import ChatController from "../controllers/chatController";
const ChatRouter: Router = express.Router();

ChatRouter.get("getStores", async (req: Request, res: Response) => {
  ChatController.index(req, res);
});

export default ChatRouter;

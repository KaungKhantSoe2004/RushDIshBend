import { Request, Response } from "express";

const ChatController = {
  index: async (req: Request, res: Response): Promise<void> => {
    console.log("Chat Controller index");
  },
};
export default ChatController;

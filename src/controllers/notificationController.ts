import { Request, Response } from "express";

const NotificationController = {
  index: async (req: Request, res: Response): Promise<void> => {
    console.log("Notification Controller index");
  },
};
export default NotificationController;

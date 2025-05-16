import { Request, Response } from "express";

const UserController = {
  index: async (req: Request, res: Response): Promise<void> => {
    console.log("UserController index");
  },
};
export default UserController;

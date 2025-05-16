import { Request, Response } from "express";

const StoreController = {
  index: async (req: Request, res: Response): Promise<void> => {
    console.log("StoreController index");
  },
};
export default StoreController;

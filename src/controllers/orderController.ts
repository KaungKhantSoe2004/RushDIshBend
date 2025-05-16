import { Request, Response } from "express";

const OrderController = {
  index: async (req: Request, res: Response): Promise<void> => {
    console.log("Order Controller index");
  },
};
export default OrderController;

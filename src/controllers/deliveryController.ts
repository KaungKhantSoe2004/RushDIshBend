import { Request, Response } from "express";

const DeliveryController = {
  index: async (req: Request, res: Response): Promise<void> => {
    console.log("Delivery Controller index");
  },
};
export default DeliveryController;

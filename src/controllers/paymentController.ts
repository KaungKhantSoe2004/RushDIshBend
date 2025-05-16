import { Request, Response } from "express";

const PaymentController = {
  index: async (req: Request, res: Response): Promise<void> => {
    console.log("Payment Controller index");
  },
};
export default PaymentController;

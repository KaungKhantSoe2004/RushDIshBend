import { Request, Response } from "express";

const PromotionController = {
  index: async (req: Request, res: Response): Promise<void> => {
    console.log("Promotion Controller index");
  },
};
export default PromotionController;

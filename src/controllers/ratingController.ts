import { Request, Response } from "express";

const RatingController = {
  index: async (req: Request, res: Response): Promise<void> => {
    console.log("Rating Controller index");
  },
};
export default RatingController;

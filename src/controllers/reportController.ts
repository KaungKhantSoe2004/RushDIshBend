import { Request, Response } from "express";

const ReportController = {
  index: async (req: Request, res: Response): Promise<void> => {
    console.log("Report Controller index");
  },
};
export default ReportController;

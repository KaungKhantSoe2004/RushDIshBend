import { Response } from "express";

const AuthController = {
  index: async (req, res): Promise<Response> => {
    return res.json({
      data: "authenicated succesfully",
    });
  },
};

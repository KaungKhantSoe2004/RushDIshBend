import { Request, response, Response } from "express";
import pgPool from "../db";
import getToken from "../helpers/createToken";
import hashPassword from "../helpers/hashPassword";
const bcrypt = require("bcryptjs");
const StoreController = {
  index: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        message: "Email or Password is missing",
      });
    } else {
      await pgPool.query(
        "SELECT * FROM stores WHERE email = $1",
        [email],
        (err, result) => {
          if (err) {
            res.status(500).json({
              message: "Internal Server Database Error",
            });
          } else {
            if (result.rows.length > 0) {
              const user = result.rows[0];
              const hashedPassword = user.password;
              const pepperPassword = password + process.env.SECRET_PEPPER;
              if (bcrypt.compareSync(pepperPassword, hashedPassword)) {
                const token = getToken(user.id, user.role, "store");
                res.cookie("jwt", token, {
                  httpOnly: true,
                  maxAge: 3 * 24 * 60 * 60 * 1000,
                });
                res.status(200).json({
                  message: "Login successful",
                });
              } else {
                res.status(401).json({
                  message: "Invalid Password",
                });
              }
            } else {
              res.status(404).json({
                message: "User not found",
              });
            }
          }
        }
      );
    }
  },

};
export default StoreController;

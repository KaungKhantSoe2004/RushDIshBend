import { Request, Response } from "express";
import pgPool from "../db";
import getToken from "../helpers/createToken";
const bcrypt = require("bcryptjs");
const UserController = {
  userLogin: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        message: "Email or Password is missing",
      });
    } else {
      await pgPool.query(
        "SELECT * FROM users WHERE email = $1 AND role = 'admin'",
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
                const token = getToken(user.id, user.role, "user");
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
export default UserController;

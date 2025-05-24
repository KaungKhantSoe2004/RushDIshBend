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
  storeCreate: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        phoneOne,
        phoneTwo,
        email,
        addressOne,
        addressTwo,
        role,
        owner,
        rating,
        password,
      } = req.body;
      if (
        !name ||
        !email ||
        !phoneOne ||
        !phoneTwo ||
        !addressOne ||
        !addressTwo ||
        !role ||
        !owner ||
        !rating ||
        !password
      ) {
        res.status(400).json({
          success: false,
          data: `Missing required fields`,
        });
        return;
      } else {
        const hashedPassword = hashPassword(password);
        const fileName = req.file?.filename;
        await pgPool.query(
          `INSERT INTO stores (
          name, phone_one, phone_two, email, address_one, address_two,
          account_status, password_hash, role, owner, profile
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            name,
            phoneOne,
            phoneTwo,
            email,
            addressOne,
            addressTwo,
            "active",
            hashedPassword,
            "store",
            owner,
            fileName,
          ]
        );
        res.status(200).json({
          message: "true",
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        data: error,
      });
    }
  },
};
export default StoreController;

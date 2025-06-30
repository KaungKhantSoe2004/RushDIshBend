import { Request, response, Response } from "express";
import pgPool from "../db";
import getToken from "../helpers/createToken";
import hashPassword from "../helpers/hashPassword";
import PhoneValiation from "../helpers/validation/phoneNumberValidation";
import deleteImage from "../helpers/deleteFile";
import profileUpdateValidation from "../helpers/validation/profileUpdateValidation";
const bcrypt = require("bcryptjs");
const StoreController = {
  me: async (req: Request, res: Response): Promise<void> => {
    console.log(req);
    try {
      const {
        id: user_id,
        role: user_role,
        auth: user_auth,
      } = (req as any).user;

      console.log(user_id, user_role, user_auth, "is id");

      // if (user_role === "admin" && user_auth === "admin") {
      const result = await pgPool.query("SELECT * FROM stores WHERE id = $1", [
        user_id,
      ]);

      if (result.rows.length > 0) {
        const user = result.rows[0];
        res.status(200).json({
          data: user,
          message: "success",
        });
      } else {
        res.status(404).json({
          message: "User not found",
        });
      }
      // } else {
      //   res.status(401).json({
      //     message: "Unauthorized",
      //   });
      // }
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        data: error,
      });
    }
  },
  storeLogin: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
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
                data: err,
              });
            } else {
              if (result.rows.length > 0) {
                const user = result.rows[0];
                console.log(user, "is user");
                const hashedPassword: string = String(user.password_hash);
                const pepperPassword = password + process.env.SECRET_PEPPER;
                console.log(
                  bcrypt.compareSync(pepperPassword, hashedPassword),
                  pepperPassword,
                  hashedPassword
                );

                if (bcrypt.compareSync(pepperPassword, hashedPassword)) {
                  const token = getToken(user.id, user.role, "store");
                  console.log(
                    token,
                    "is token",
                    "and user role is ",
                    user.role
                  );
                  pgPool.query(
                    "UPDATE stores SET account_status = 'true' WHERE id = $1",
                    [user.id]
                  );
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
                  message: "Store not found",
                });
              }
            }
          }
        );
      }
    } catch (error) {
      console.log(error, "is error");
      res.status(500).json({
        message: "Internal Server Error",
        data: error,
      });
    }
  },
  storeDashboard: async (req: Request, res: Response): Promise<void> => {
    try {
    } catch (err) {
      console.error("Error in adminDashboard:", err);
      res.status(500).json({ message: "Server error", data: err });
    }
  },
  profileDetails: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id: user_id,
        role: user_role,
        auth: user_auth,
      } = (req as any).user;

      const { rows: profile } = await pgPool.query(
        `SELECT id, name, email, phone_one, phone_two, address_one, address_two, account_status, role, profile, created_at FROM users WHERE id = $1`,
        [user_id]
      );
      if (profile) {
        res.status(200).json({
          message: "Success",
          data: profile[0],
        });
      }
    } catch (error) {
      console.error("Error in notificationList:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  updateProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(req.body, "is heheheh body");
      const {
        id: user_id,
        role: user_role,
        auth: user_auth,
      } = (req as any).user;
      const { name, phone_one, phone_two, email, address_one, address_two } =
        req.body;
      const isValid = await profileUpdateValidation(user_id, req.body, res);
      if (!isValid) {
        return;
      }

      const fileName = req.file?.filename;
      console.log(fileName, "is filename");
      if (fileName) {
        const prevData = await pgPool.query(
          `SELECT profile , phone_one , phone_two FROM users WHERE id = $1`,
          [user_id]
        );
        const prevProfile = prevData.rows[0].profile;

        if (prevProfile) {
          deleteImage(prevProfile);
        }

        await PhoneValiation(phone_one, phone_two, user_id, "stores");
        console.log("after query");
        await pgPool.query(
          `UPDATE users SET
          name = $1,
          phone_one = $2,
          phone_two = $3,
          email = $4,
          address_one = $5,
          address_two = $6,
          profile = $7
          WHERE id = $8
        `,
          [
            name,
            phone_one,
            phone_two,
            email,
            address_one,
            address_two,
            fileName,
            user_id,
          ]
        );
      } else {
        PhoneValiation(phone_one, phone_two, user_id, "stores");
        await pgPool.query(
          `UPDATE users SET
          name = $1,
          phone_one = $2,
          phone_two = $3,
          email = $4,
          address_one = $5,
          address_two = $6
          WHERE id = $7
        `,
          [name, phone_one, phone_two, email, address_one, address_two, user_id]
        );
      }

      res.status(200).json({
        message: "true",
      });
    } catch (error) {
      console.error("Error in notificationList:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
export default StoreController;

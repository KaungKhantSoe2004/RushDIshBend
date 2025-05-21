import { Request, Response } from "express";
import pgPool from "../db";
import getToken from "../helpers/createToken";
const bcrypt = require("bcryptjs");
const AdminController = {
  me: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id: user_id,
        role: user_role,
        auth: user_auth,
      } = (req as any).user;

      console.log(user_id, user_role, user_auth, "is id");

      // if (user_role === "admin" && user_auth === "admin") {
      const result = await pgPool.query("SELECT * FROM users WHERE id = $1", [
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
  adminLogin: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
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
                data: err,
              });
            } else {
              if (result.rows.length > 0) {
                const user = result.rows[0];

                const hashedPassword: string = String(user.password_hash);
                const pepperPassword = password + process.env.SECRET_PEPPER;
                if (bcrypt.compareSync(pepperPassword, hashedPassword)) {
                  const token = getToken(user.id, user.role, "admin");
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
    } catch (error) {
      console.log(error, "is error");
      res.status(500).json({
        message: "Internal Server Error",
        data: error,
      });
    }
  },
  adminDashboard: async (req: Request, res: Response): Promise<void> => {
    try {
      const ordersTodayQuery = `
        SELECT * FROM orders 
        WHERE created_at::date = CURRENT_DATE 
        ORDER BY created_at DESC 
        LIMIT 10
      `;

      const randomFiveStoresQuery = `
        SELECT * FROM stores 
        ORDER BY RANDOM() 
        LIMIT 5
      `;

      const storeCountQuery = `SELECT COUNT(*) FROM stores`;

      const totalOrdersCountQuery = `SELECT COUNT(*) FROM orders`;

      const [
        ordersTodayResult,
        randomStoresResult,
        storeCountResult,
        orderCountResult,
      ] = await Promise.all([
        pgPool.query(ordersTodayQuery),
        pgPool.query(randomFiveStoresQuery),
        pgPool.query(storeCountQuery),
        pgPool.query(totalOrdersCountQuery),
      ]);

      res.status(200).json({
        ordersToday: ordersTodayResult.rows,
        randomFiveStores: randomStoresResult.rows,
        storeCount: parseInt(storeCountResult.rows[0].count, 10),
        orderCount: parseInt(orderCountResult.rows[0].count, 10),
      });
    } catch (err) {
      console.error("Error in adminDashboard:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
  adminStore: async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      message: "Admin store",
    });
  },
  adminDelivery: async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      message: "Admin Delivery",
    });
  },
  adminOrderList: async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      message: "Admin order list",
    });
  },
  adminUserList: async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      message: "Admin user list",
    });
  },
};
export default AdminController;

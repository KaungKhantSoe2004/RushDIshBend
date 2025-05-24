import { Request, Response } from "express";
import pgPool from "../db";
import getToken from "../helpers/createToken";
import hashPassword from "../helpers/hashPassword";
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
                pgPool.query(
                  "UPDATE users SET is_active = 'true' WHERE id = $1",
                  [user.id]
                );
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
      const recentOrdersQuery = `SELECT * FROM recent_orders  
               ORDER BY created_at DESC  
               LIMIT 5;
                `;
      const ordersTodayCountQuery = `SELECT COUNT(*) FROM recent_orders  
               WHERE created_at::date = CURRENT_DATE  
                `;
      const randomFiveStoresQuery = `
        SELECT * FROM store_order_counts 
        ORDER BY RANDOM() 
        LIMIT 5
      `;

      const storeCountQuery = `SELECT COUNT(*) FROM stores`;

      const totalOrdersCountQuery = `SELECT COUNT(*) FROM orders`;
      const activeUsersQuery = `SELECT * FROM users WHERE is_active = 'true'`;
      const [
        recentOrders,
        ordersTodayCount,
        randomStoresResult,
        storeCountResult,
        orderCountResult,
        activeUsers,
      ] = await Promise.all([
        pgPool.query(recentOrdersQuery),
        pgPool.query(ordersTodayCountQuery),
        pgPool.query(randomFiveStoresQuery),
        pgPool.query(storeCountQuery),
        pgPool.query(totalOrdersCountQuery),
        pgPool.query(activeUsersQuery),
      ]);

      res.status(200).json({
        recentOrders: recentOrders.rows,
        todayOrdersCount: parseInt(ordersTodayCount.rows[0].count, 10),
        randomFiveStores: randomStoresResult.rows,
        storeCount: parseInt(storeCountResult.rows[0].count, 10),
        orderCount: parseInt(orderCountResult.rows[0].count, 10),
        activeUsers: activeUsers.rows,
      });
    } catch (err) {
      console.error("Error in adminDashboard:", err);
      res.status(500).json({ message: "Server error", data: err });
    }
  },
  logout: async (req: Request, res: Response): Promise<void> => {
    res.clearCookie("jwt", {
      httpOnly: true,
    });
    res.status(200).json({ message: "logged out" });
  },
  adminStore: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;

      const storeQuery = `
      SELECT id, name, address_one AS location, status, owner, rating, profile 
      FROM stores
      LIMIT $1 OFFSET $2
    `;

      const countAllQuery = `SELECT COUNT(*)::int as total FROM stores`;
      const countActiveQuery = `SELECT COUNT(*)::int as active FROM stores WHERE status = 'active'`;
      const countPendingQuery = `SELECT COUNT(*)::int as pending FROM stores WHERE status = 'pending'`;
      const countSuspendedQuery = `SELECT COUNT(*)::int as suspended FROM stores WHERE status = 'suspended'`;

      const [
        storeResult,
        countAllResult,
        countActiveResult,
        countPendingResult,
        countSuspendedResult,
      ] = await Promise.all([
        pgPool.query(storeQuery, [limit, offset]),
        pgPool.query(countAllQuery),
        pgPool.query(countActiveQuery),
        pgPool.query(countPendingQuery),
        pgPool.query(countSuspendedQuery),
      ]);

      const total = countAllResult.rows[0].total;
      const totalPages = Math.ceil(total / limit);

      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

      res.status(200).json({
        message: "Admin store",
        data: storeResult.rows,
        counts: {
          total,
          active: countActiveResult.rows[0].active,
          pending: countPendingResult.rows[0].pending,
          suspended: countSuspendedResult.rows[0].suspended,
        },
        pagination: {
          page,
          limit,
          totalPages,
          pages, // Array like [1, 2, 3, ..., totalPages]
        },
      });
    } catch (error) {
      console.error("adminStore error:", error);
      res.status(500).json({ message: "Internal Server Error", data: error });
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
  storeSuspend: async (req: Request, res: Response): Promise<void> => {
    try {
      const store_id = req.body.id;
      await pgPool.query(
        "UPDATE stores SET status = 'suspended' WHERE id = $1 ",
        [store_id]
      );
      res.status(200).json({
        message: "store suspended",
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        data: error,
      });
    }
  },
  storePending: async (req: Request, res: Response): Promise<void> => {
    try {
      const store_id = req.body.id;
      await pgPool.query(
        "UPDATE stores SET status = 'pending' WHERE id = $1 ",
        [store_id]
      );
      res.status(200).json({
        message: "store pending",
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        data: error,
      });
    }
  },
  storeActive: async (req: Request, res: Response): Promise<void> => {
    try {
      const store_id = req.body.id;
      await pgPool.query("UPDATE stores SET status = 'active' WHERE id = $1 ", [
        store_id,
      ]);
      res.status(200).json({
        message: "store activated",
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        data: error,
      });
    }
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

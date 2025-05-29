import { Request, response, Response } from "express";
import pgPool from "../db";
import getToken from "../helpers/createToken";
import hashPassword from "../helpers/hashPassword";
import deleteImage from "../helpers/deleteFile";
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
      const { search } = req.query;
      const limit = 10;
      const offset = (page - 1) * limit;
      let storeQuery: string;
      let queryParams: any[];
      if (search) {
        storeQuery = `SELECT id, name, address_one AS location, status, owner, rating, profile 
      FROM stores WHERE name ILIKE $1 OR address_one ILIKE $1 LIMIT $2 OFFSET $3 `;
        queryParams = [`%${search}%`, limit, offset];
      } else {
        storeQuery = `
      SELECT id, name, address_one AS location, status, owner, rating, profile 
      FROM stores
      LIMIT $1 OFFSET $2
    `;
        queryParams = [limit, offset];
      }
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
        pgPool.query(storeQuery, queryParams),
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
        console.log(fileName, "is file name");
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
  storeStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const status = req.body.status;
      const store_id = req.body.storeId;
      await pgPool.query("UPDATE stores SET status = $1 WHERE id = $2 ", [
        status,
        store_id,
      ]);
      res.status(200).json({
        message: "store status updated",
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        data: error,
      });
    }
  },
  eachStore: async (req: Request, res: Response): Promise<void> => {
    try {
      const store_id = req.params.id;
      console.log(store_id);
      if (store_id) {
        const { rows } = await pgPool.query(
          `SELECT * FROM stores WHERE id = $1`,
          [store_id]
        );

        res.status(200).json({ data: rows[0] });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  updateStore: async (req: Request, res: Response): Promise<void> => {
    console.log(req.file);
    try {
      const {
        id,
        name,
        phone_one,
        phone_two,
        email,
        address_one,
        address_two,
        owner,
        rating,
        status,
      } = req.body;

      if (
        !id ||
        !name ||
        !email ||
        !phone_one ||
        !phone_two ||
        !address_one ||
        !address_two ||
        !owner
      ) {
        res.status(400).json({
          success: false,
          data: "Missing required fields",
        });
        return;
      }

      const fileName = req.file?.filename;
      console.log(fileName, "is filename");
      if (fileName) {
        const prevData = await pgPool.query(
          `SELECT profile , phone_one , phone_two FROM stores WHERE id = $1`,
          [id]
        );
        const prevProfile = prevData.rows[0].profile;

        console.log(prevProfile);
        deleteImage(prevProfile);
      }
      const phones = await pgPool.query(
        "SELECT * FROM stores WHERE phone_one = $1 AND id != $2",
        [phone_one, id]
      );

      if (phones.rows.length > 0) {
        response.status(401).json({
          message: "Phone Number One already exists",
        });
        return;
      }
      const phonesTwo = await pgPool.query(
        "SELECT * FROM stores WHERE phone_two = $1 AND id != $2",
        [phone_two, id]
      );

      if (phonesTwo.rows.length > 0) {
        response.status(401).json({
          message: "Phone Number Two already exists",
        });
        return;
      }
      await pgPool.query(
        `UPDATE stores SET
        name = $1,
        phone_one = $2,
        phone_two = $3,
        email = $4,
        address_one = $5,
        address_two = $6,
        owner = $7,
        rating = $8,
        status = $9,
        profile = $10
        WHERE id = $11
      `,
        [
          name,
          phone_one,
          phone_two,
          email,
          address_one,
          address_two,
          owner,
          rating || null,
          status || "active",
          fileName,
          id,
        ]
      );

      res.status(200).json({
        message: "true", // Matching your create response style
      });
    } catch (error) {
      console.error("Update store error:", error);
      res.status(500).json({
        message: "Internal server error", // Matching your error response style
        data: error instanceof Error ? error.message : error,
      });
    }
  },
  deleteStore: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      pgPool.query("DELETE FROM stores WHERE id = $1", [id]);
      const prevData = await pgPool.query(
        `SELECT profile , phone_one , phone_two FROM stores WHERE id = $1`,
        [id]
      );
      const prevProfile = prevData.rows[0].profile;

      console.log(prevProfile);
      deleteImage(prevProfile);
      res.status(200).json({
        message: "Deleting Success",
      });
    } catch {
      res.status(500).json({ message: "Falied Deleting the store" });
    }
  },
  adminDelivery: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const { search } = req.query;
      const limit = 10;
      const offset = (page - 1) * limit;
      let tableQuery: string;
      let queryParams: any[];
      if (search) {
        tableQuery = `SELECT id, name, address_one AS zone, account_status, completed_orders, total_profit, profile ,today_profit
      FROM delivery_table WHERE name ILIKE $1 OR address_one ILIKE $1 LIMIT $2 OFFSET $3 `;
        queryParams = [`%${search}%`, limit, offset];
      } else {
        tableQuery = `
      SELECT id, name, address_one AS zone, account_status, completed_orders, total_profit, profile ,today_profit
      FROM delivery_table
      LIMIT $1 OFFSET $2
    `;
        queryParams = [limit, offset];
      }
      const totalProfitQuery = `SELECT SUM(profit) as total_profit FROM orders`;
      const countOnlineDeliveryQuery = `SELECT COUNT(id) FROM delivery_agents WHERE account_status = 'active'`;
      const countOfflineDeliveryQuery = `SELECT COUNT(id) FROM delivery_agents WHERE account_status = 'offline'`;
      const countAllDeliveryQuery = `SELECT COUNT(id) FROM delivery_agents `;
      const [tableResult, totalProfit, onlineCount, offlineCount, allCount] =
        await Promise.all([
          pgPool.query(tableQuery, queryParams),
          pgPool.query(totalProfitQuery),
          pgPool.query(countOnlineDeliveryQuery),
          pgPool.query(countOfflineDeliveryQuery),
          pgPool.query(countAllDeliveryQuery),
        ]);

      const total = totalProfit.rows[0].total_profit;
      const totalPages = Math.ceil(total / limit);

      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

      res.status(200).json({
        message: "Admin Delivery ",
        data: tableResult.rows,
        counts: {
          totalEarnings: total || 0,
          online_deli: onlineCount.rows[0].count,
          offline_deli: offlineCount.rows[0].count,
          total_deli: allCount.rows[0].count,
        },
        pagination: {
          page,
          limit,
          totalPages,
          pages,
        },
      });
    } catch (error) {
      console.error("adminStore error:", error);
      res.status(500).json({ message: "Internal Server Error", data: error });
    }
  },
  deliveryCreate: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        phone_one,
        phone_two,
        email,
        address_one,
        address_two,
        vehicle_type,
        vehicle_number,
        rating,
        password,
      } = req.body;
      if (
        !name ||
        !email ||
        !phone_one ||
        !phone_two ||
        !address_one ||
        !address_two ||
        !vehicle_number ||
        !vehicle_type ||
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
          `INSERT INTO delivery_agents (
          name, phone_one, phone_two, email, address_one, address_two,
           password_hash, account_status, vehicle_number, vehicle_type ,rating, profile
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            name,
            phone_one,
            phone_two,
            email,
            address_one,
            address_two,
            hashedPassword,
            "active",
            vehicle_number,
            vehicle_type,
            rating || 1.0,
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
  eachDelivery: async (req: Request, res: Response): Promise<void> => {
    try {
      const delivery_id = req.params.id;
      if (delivery_id) {
        const { rows: DeliRows } = await pgPool.query(
          `SELECT *
      FROM delivery_table WHERE id = $1`,
          [delivery_id]
        );
        const { rows: RecentOrderRows } = await pgPool.query(
          `SELECT o.* , u.name as customer FROM orders as o JOIN users as u ON o.user_id = u.id WHERE o.delivery_id = $1 ORDER BY created_at DESC lIMIT 5`,
          [delivery_id]
        );
        if (DeliRows.length == 1 && RecentOrderRows) {
          const deliveryAgent = DeliRows[0];
          res
            .status(200)
            .json({ data: deliveryAgent, recentOrders: RecentOrderRows });
        } else {
          res.status(404).json({
            message: "Delivery Agent not Found",
          });
        }
      } else {
        res.status(400).json({
          message: "Delivery ID is required",
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
export default AdminController;

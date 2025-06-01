import { Request, response, Response } from "express";
import pgPool from "../db";
import getToken from "../helpers/createToken";
import hashPassword from "../helpers/hashPassword";
import deleteImage from "../helpers/deleteFile";
import PhoneValiation from "../helpers/validation/phoneNumberValidation";
import storeCreationValidtion from "../helpers/validation/storeValidation";
import validateDeliveryAgentInput from "../helpers/validation/dliveryAgentValidation";
import storeUpdateValidation from "../helpers/validation/storeUpdateValidation";
import deliveryAgentUpdateValidation from "../helpers/validation/deliveryUpdateValidation";
import { validateUserCreationInput } from "../helpers/validation/userValidation";
import userUpdateValidation from "../helpers/validation/userUpdateValidation";
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

      const isValid = await storeCreationValidtion(req.body, res);

      if (!isValid) {
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
      const isValid = await storeUpdateValidation(req.body, res);
      if (!isValid) {
        // res.status(400).json({
        //   success: false,
        //   data: "Missing required fields",
        // });
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

        if (prevProfile) {
          deleteImage(prevProfile);
        }

        await PhoneValiation(phone_one, phone_two, id, "stores");
        console.log("after query");
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
      } else {
        PhoneValiation(phone_one, phone_two, id, "stores");
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
        status = $9
        WHERE id = $10
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
            id,
          ]
        );
      }

      res.status(200).json({
        message: "true",
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

      if (prevProfile) {
        deleteImage(prevProfile);
      }

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
        tableQuery = `SELECT id, name, address_one AS zone, account_status, rating, completed_orders, total_profit, profile ,today_profit
      FROM delivery_table WHERE name ILIKE $1 OR address_one ILIKE $1 LIMIT $2 OFFSET $3 `;
        queryParams = [`%${search}%`, limit, offset];
      } else {
        tableQuery = `
      SELECT id, name, address_one AS zone, account_status, rating, completed_orders, total_profit, profile ,today_profit
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
      const totalPages = Math.ceil(allCount.rows[0].count / limit);

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
      const isValid = await validateDeliveryAgentInput(req.body, res);
      if (!isValid) {
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
  updateDelivery: async (req: Request, res: Response): Promise<void> => {
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
        vehicle_number,
        vehicle_type,
      } = req.body;
      console.log(req.body, "is body");
      const isValid = await deliveryAgentUpdateValidation(req.body, res);
      if (!isValid) {
        return;
      }

      const fileName = req.file?.filename;
      console.log(fileName, "is filename");
      if (fileName) {
        const prevData = await pgPool.query(
          `SELECT profile , phone_one , phone_two FROM delivery_agents WHERE id = $1`,
          [id]
        );
        const prevProfile = prevData.rows[0].profile;

        if (prevProfile) {
          deleteImage(prevProfile);
        }

        await PhoneValiation(phone_one, phone_two, id, "stores");
        console.log("after query");
        await pgPool.query(
          `UPDATE delivery_agents SET
    name = $1,
    phone_one = $2,
    phone_two = $3,
    email = $4,
    address_one = $5,
    address_two = $6,
    vehicle_type = $7,
    vehicle_number = $12,
    rating = $8,
    account_status = $9,
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
            vehicle_type,
            rating || "1.0",
            status || "active",
            fileName,
            id,
            vehicle_number,
          ]
        );
      } else {
        PhoneValiation(phone_one, phone_two, id, "stores");
        await pgPool.query(
          `UPDATE delivery_agents SET
    name = $1,
    phone_one = $2,
    phone_two = $3,
    email = $4,
    address_one = $5,
    address_two = $6,
    vehicle_type = $10,
    vehicle_number = $11,
    rating = $7,
    account_status = $8
    WHERE id = $9
  `,
          [
            name,
            phone_one,
            phone_two,
            email,
            address_one,
            address_two,
            rating || null,
            status || "active",

            id,
            vehicle_type,
            vehicle_number,
          ]
        );
      }

      res.status(200).json({
        message: "true",
      });
    } catch (error) {
      console.error("Update Delivery error:", error);
      res.status(500).json({
        message: "Internal server error",
        data: error instanceof Error ? error.message : error,
      });
    }
  },
  adminOrderList: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const { search } = req.query;
      const limit = 10;
      const offset = (page - 1) * limit;
      let orderQuery: string;
      let queryParams: any[];
      if (search) {
        orderQuery = `SELECT * FROM order_table WHERE customer_name ILIKE $1 LIMIT $2 OFFSET $3`;
        queryParams = [`%${search}%`, limit, offset];
      } else {
        orderQuery = `SELECT * FROM order_table LIMIT $1 OFFSET $2`;
        queryParams = [limit, offset];
      }
      const countAllorders = `SELECT COUNT(*)::int as total FROM orders`;
      const countProgressOrders = `SELECT COUNT(*)::int as progressCount FROM orders WHERE status = 'in_progress'`;
      const countCancelledOrders = `SELECT COUNT(*)::int as cancelledCount FROM orders WHERE status = 'cancelled'`;
      const countDeliveredOrders = `SELECT COUNT(*)::int as dlieveredCount FROM orders WHERE status = 'delivered'`;
      const orders = await pgPool.query(orderQuery, queryParams);
      const totalOrders = await pgPool.query(countAllorders);
      const progressOrders = await pgPool.query(countProgressOrders);
      const cancelledOrders = await pgPool.query(countCancelledOrders);
      const deliveredOrders = await pgPool.query(countDeliveredOrders);
      const totalPages = Math.ceil(totalOrders.rows[0].total / limit);

      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
      if (
        orders.rows &&
        totalOrders.rows &&
        progressOrders.rows &&
        cancelledOrders.rows &&
        deliveredOrders.rows
      ) {
        res.status(200).json({
          message: "Success",
          data: orders.rows,
          counts: {
            totalOrders: totalOrders.rows[0].total,
            progressOrders: progressOrders.rows[0].progresscount,
            cancelledOrders: cancelledOrders.rows[0].cancelledcount,
            deliveredOrders: deliveredOrders.rows[0].dlieveredcount,
          },
          pagination: {
            page,
            limit,
            totalPages,
            pages,
          },
        });
      } else {
        res.status(404).json({
          message: "No orders found",
        });
      }
    } catch (error) {
      console.log(error, "is error");
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },
  adminUserList: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const { search } = req.query;

      const limit = 2;
      const offset = (page - 1) * limit;
      let userQuery: string;
      let queryParams: any[];
      if (search) {
        userQuery = `SELECT 
  u.id, 
  u.name, 
  u.email, 
  u.phone_one, 
  u.phone_two, 
  u.address_one, 
  u.address_two, 
  u.role, 
  u.account_status, 
  u.points, 
  u.profile, 
  u.created_at,
  COUNT(o.id) AS orderCount,
  MAX(o.created_at) AS last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE 
  u.name ILIKE $1 
  OR u.email ILIKE $1 
  OR u.phone_one ILIKE $1 
  OR u.phone_two ILIKE $1
GROUP BY 
  u.id
LIMIT $2 OFFSET $3;
`;
        queryParams = [`%${search}%`, limit, offset];
      } else {
        userQuery = `SELECT 
  u.id, 
  u.name, 
  u.email, 
  u.phone_one, 
  u.phone_two, 
  u.address_one, 
  u.address_two, 
  u.role, 
  u.account_status, 
  u.points, 
  u.profile, 
  u.created_at,
  COUNT(o.id) AS orderCount,
  MAX(o.created_at) AS last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.role = 'user'
GROUP BY 
  u.id
LIMIT $1 OFFSET $2;
`;
        queryParams = [limit, offset];
      }
      const countAllUsersQuery = `SELECT COUNT(*)::int as total FROM users WHERE users.role = 'user'`;
      const countActiveUsersQuery = `SELECT COUNT(*)::int as active FROM users WHERE account_status = 'active' AND role = 'user'`;
      const countInactiveUsersQuery = `SELECT COUNT(*)::int as inactive FROM users WHERE account_status = 'inactive' AND role = 'user'`;
      const countBannedUsersQuery = `SELECT COUNT(*)::int as banned FROM users WHERE account_status = 'banned' AND role = 'user'`;
      const [
        userResult,
        countAllResult,
        countActiveResult,
        countInactiveResult,
        countBannedResult,
      ] = await Promise.all([
        pgPool.query(userQuery, queryParams),
        pgPool.query(countAllUsersQuery),
        pgPool.query(countActiveUsersQuery),
        pgPool.query(countInactiveUsersQuery),
        pgPool.query(countBannedUsersQuery),
      ]);
      const usersData = userResult.rows;
      const total = countAllResult.rows[0].total;
      const totalPages = Math.ceil(total / limit);
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
      const activeUsersCount = countActiveResult.rows[0].active;
      const inactiveUsersCount = countInactiveResult.rows[0].inactive;
      const bannedUsersCount = countBannedResult.rows[0].banned;
      res.status(200).json({
        message: "admin user list",
        data: usersData,
        pagination: {
          page,
          limit,
          totalPages,
          pages,
        },
        counts: {
          total,
          active: activeUsersCount,
          inactive: inactiveUsersCount,
          banned: bannedUsersCount,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },
  adduser: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(req.body);
      const {
        name,
        phone_one,
        phone_two,
        email,
        address_one,
        address_two,
        password,
      } = req.body;
      const isValid = await validateUserCreationInput(req.body, res);
      if (!isValid) {
        return;
      } else {
        const hashedPassword = hashPassword(password);
        const fileName = req.file?.filename || null;
        await pgPool.query(
          `INSERT INTO users (
          name, phone_one, phone_two, email, address_one, address_two,
           password_hash, profile
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            name,
            phone_one,
            phone_two,
            email,
            address_one,
            address_two,
            hashedPassword,
            fileName,
          ]
        );
        res.status(200).json({
          message: "true",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
        data: error,
      });
    }
  },
  updateUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id,
        name,
        phone_one,
        phone_two,
        email,
        address_one,
        address_two,
      } = req.body;
      const isValid = await userUpdateValidation(req.body, res);
      if (!isValid) {
        return;
      }

      const fileName = req.file?.filename;
      console.log(fileName, "is filename");
      if (fileName) {
        const prevData = await pgPool.query(
          `SELECT profile , phone_one , phone_two FROM users WHERE id = $1`,
          [id]
        );
        const prevProfile = prevData.rows[0].profile;

        if (prevProfile) {
          deleteImage(prevProfile);
        }

        await PhoneValiation(phone_one, phone_two, id, "stores");
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
            id,
          ]
        );
      } else {
        PhoneValiation(phone_one, phone_two, id, "stores");
        await pgPool.query(
          `UPDATE users SET
        name = $1,
        phone_one = $2,
        phone_two = $3,
        email = $4,
        address_one = $5,
        address_two = $6,

        WHERE id = $7
      `,
          [name, phone_one, phone_two, email, address_one, address_two, id]
        );
      }

      res.status(200).json({
        message: "true",
      });
    } catch (error) {
      console.error("Update store error:", error);
      res.status(500).json({
        message: "Internal server error", // Matching your error response style
        data: error instanceof Error ? error.message : error,
      });
    }
  },
  eachUser: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("in user ");
      const user_id = req.params.id;
      if (user_id) {
        const { rows: userRows } = await pgPool.query(
          `SELECT *
      FROM users WHERE id = $1`,
          [user_id]
        );
        const { rows: RecentOrderRows } = await pgPool.query(
          `SELECT o.* , u.name as customer FROM orders as o JOIN users as u ON o.user_id = u.id WHERE o.user_id = $1 ORDER BY created_at DESC lIMIT 5`,
          [user_id]
        );
        const { rows: totalOrders } = await pgPool.query(
          `SELECT SUM(profit) as totalSpent , COUNT(*) FROM orders as totalOrderCount WHERE user_id = $1`,
          [user_id]
        );
        if (userRows.length == 1 && RecentOrderRows && totalOrders) {
          const user = userRows[0];
          const { totalspent, count } = totalOrders[0];
          user.totalSpent = totalspent;
          user.orderCount = count;
          console.log(totalOrders[0]);
          res.status(200).json({
            data: { ...user },
            recentOrders: RecentOrderRows,
          });
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
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
        data: error,
      });
    }
  },
};
export default AdminController;

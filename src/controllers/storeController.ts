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
  setOrderStatusChange: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id: store_id,
        role: user_role,
        auth: user_auth,
      } = (req as any).user;
      const order_id = req.params.id;
      const action = req.params.action;
      const response = await pgPool.query(
        `UPDATE orders SET status = $1 WHERE id = $2 AND store_id = $3 RETURNING *`,
        [action, order_id, store_id]
      );

      if (response.rows.length > 0) {
        res.status(200).json({
          message: "Order status updated Successfully",
          data: response.rows[0],
        });
      }
    } catch (error) {
      console.error("Error in storeOrder:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  storeDashboard: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id: store_id,
        role: user_role,
        auth: user_auth,
      } = (req as any).user;

      const ordersTodayCountQuery = `
        SELECT COUNT(*) FROM Orders 
        WHERE store_id = $1 AND DATE(created_at) = CURRENT_DATE
      `;

      const storedata = `SELECT * FROM stores WHERE id = $1`;
      const pickupCountQuery = `SELECT COUNT(*) FROM orders WHERE order_type = 'pickup'`;
      const deliCountQuery = `SELECT COUNT(*) FROM orders WHERE order_type = 'delivery'`;

      const sumTotalAmountOrderQuery = `
        SELECT SUM(total_amount) AS total 
        FROM orders 
        WHERE store_id = $1 AND DATE(created_at) = CURRENT_DATE
      `;

      const formatDate = (daysAgo: number): string => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
      };

      const dayConfigs = [
        { label: "seven_days_ago", offset: 7 },
        { label: "six_days_ago", offset: 6 },
        { label: "five_days_ago", offset: 5 },
        { label: "four_days_ago", offset: 4 },
        { label: "three_days_ago", offset: 3 },
        { label: "two_days_ago", offset: 2 },
        { label: "yesterday", offset: 1 },
      ];

      const dayDataQueries = dayConfigs.map(({ label, offset }) => {
        const date = formatDate(offset);
        const query = `
    SELECT 
      COALESCE(SUM(total_amount), 0) AS sales, 
      COUNT(*) AS orders, 
      COUNT(DISTINCT user_id) AS customers, 
      '${label}' AS day
    FROM orders
    WHERE store_id = $1 AND DATE(created_at) = $2
  `;
        return pgPool.query(query, [store_id, date]);
      });

      const popularMenuQuery = `
        SELECT * FROM menu 
        WHERE store_id = $1 AND is_available = true 
        ORDER BY order_quantity DESC 
        LIMIT 5
      `;

      const pendingOrdersQuery = `
        SELECT o.* , c.name as customer FROM orders as o
        JOIN users as c ON o.user_id = c.id
        WHERE o.store_id = $1 AND o.status = 'pending'
      `;

      const allOrdersQuery = `
        SELECT * FROM orders 
        WHERE store_id = $1
      `;

      const [
        ordersTodayCount,
        storeData,
        sumTotalAmount,
        popularMenudata,
        pendingOrders,
        allOrders,
        pickupCount,
        deliCount,
        ...dayResults // ✅ Must be at the end
      ] = await Promise.all([
        pgPool.query(ordersTodayCountQuery, [store_id]),
        pgPool.query(storedata, [store_id]),
        pgPool.query(sumTotalAmountOrderQuery, [store_id]),
        pgPool.query(popularMenuQuery, [store_id]),
        pgPool.query(pendingOrdersQuery, [store_id]),
        pgPool.query(allOrdersQuery, [store_id]),
        pgPool.query(pickupCountQuery),
        pgPool.query(deliCountQuery),
        ...dayDataQueries,
      ]);
      const mySevendayData = dayResults.map((result) => result.rows[0]);
      res.status(200).json({
        todayOrdersCount: parseInt(ordersTodayCount.rows[0].count, 10),
        storeData: storeData.rows[0],
        todayTotalAmount: parseFloat(sumTotalAmount.rows[0].total) || 0,
        weekdata: mySevendayData,
        popularMenu: popularMenudata.rows,
        pickupCount: Number(pickupCount.rows[0].count),
        deliCount: Number(deliCount.rows[0].count),
        pendingOrders: pendingOrders.rows,
      });
    } catch (err) {
      console.error("Error in storeDashboard:", err);
      res.status(500).json({ message: "Server error", data: err });
    }
  },
  storeOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id: store_id,
        role: user_role,
        auth: user_auth,
      } = (req as any).user;

      const { rows: orders } = await pgPool.query(
        `SELECT o.* , d.name as delivery_name, d.phone_one as delivery_phone, d.profile as delivery_profile, u.phone_one as customer_phone , u.name as customer_name FROM orders AS o JOIN users AS u ON o.user_id = u.id JOIN delivery_agents AS d ON o.delivery_id = d.id   WHERE o.store_id = $1 `,
        [store_id]
      );

      res.status(200).json({
        message: "Success",
        data: orders,
      });
    } catch (error) {
      console.error("Error in storeOrder:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  storemenu: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: user_id, role: user_role } = (req as any).user;
      const menuList = await pgPool.query(
        `SELECT * FROM menu WHERE store_id = $1`,
        [user_id]
      );
      const categoryList = await pgPool.query(
        "SELECT * FROM menu_category WHERE store_id = $1 ",
        [user_id]
      );

      res.status(200).json({
        message: "success",
        data: menuList.rows,
        categoryData: categoryList.rows,
      });
    } catch (error) {
      console.error("Error in storemenu:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  addStoreCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: user_id, role: user_role } = (req as any).user;
      console.log(req);
      const { name, description, icon, is_active } = req.body;
      await pgPool.query(
        `INSERT INTO menu_category (
          name, description, icon, is_active, store_id
        ) VALUES ($1, $2, $3, $4 , $5)`,
        [name, description, icon, is_active, user_id]
      );
      res.status(200).json({
        message: "success",
      });
    } catch (error) {
      console.error("Error in adding storemenu:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  addMenu: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: user_id, role: user_role } = (req as any).user;
      console.log(req);
      const { name, category, price, description } = req.body;
      const fileName = req.file?.filename;
      await pgPool.query(
        `INSERT INTO menu (
          name, category, price, description, store_id , image
        ) VALUES ($1, $2, $3, $4 , $5, $6)`,
        [name, category, price, description, user_id, fileName]
      );
      res.status(200).json({
        message: "success",
      });
    } catch (error) {
      console.error("Error in adding storemenu:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  destoryMenu: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: user_id, role: user_role } = (req as any).user;
      const { id: menu_id } = req.params;
      console.log(menu_id, "is params");
      let prevImg: string;
      const prevImage = await pgPool.query(
        `SELECT image FROM menu WHERE id = $1`,
        [menu_id]
      );
      prevImg = prevImage.rows[0].image;
      deleteImage(prevImg);
      await pgPool.query("DELETE FROM menu WHERE id = $1 ", [menu_id]);
      res.status(200).json({
        message: "success",
      });
    } catch (error) {
      console.error("Error in deleting menu:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  updateMenu: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: user_id, role: user_role } = (req as any).user;
      console.log(req.body, "is updating body");

      const { name, category, price, description, id } = req.body;
      console.log(req, "is whole req");
      console.log(req.file, "is req file");
      const image = req.file?.filename;
      let data;
      let prevImg: string;
      const prevImage = await pgPool.query(
        `SELECT image FROM menu WHERE id = $1`,
        [id]
      );
      prevImg = prevImage.rows[0].image;
      // return;
      if (image) {
        deleteImage(prevImg);
        data = await pgPool.query(
          `UPDATE menu
      SET name = $1,  
          description = $2,
          category = $3,
          price = $4,
          image = $5
      WHERE id = $6
                 `,
          [name, description, category, price, image, id]
        );
      } else {
        data = await pgPool.query(
          `UPDATE menu
      SET name = $1,  
          description = $2,
          category = $3,
          price = $4
      WHERE id = $5
                 `,
          [name, description, category, price, id]
        );
      }
      console.log(data.rowCount, "is data");
      res.status(200).json({
        message: "success",
      });
    } catch (error) {
      console.error("Error in updating menu:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  updateStoreCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: user_id, role: user_role } = (req as any).user;
      console.log(req.body, "is updating body");

      const { name, description, icon, id } = req.body;

      const data = await pgPool.query(
        `UPDATE menu_category
SET name = $1,
    description = $2,
    icon = $3
WHERE id = $4
           `,
        [name, description, icon, id]
      );
      console.log(data.rowCount, "is data");
      res.status(200).json({
        message: "success",
      });
    } catch (error) {
      console.error("Error in updating storemenu:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  deleteStoreCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: user_id, role: user_role } = (req as any).user;
      const { id: category_id } = req.params;
      console.log(category_id, "ois params");
      await pgPool.query("DELETE FROM menu_category WHERE id = $1 ", [
        category_id,
      ]);
      res.status(200).json({
        message: "success",
      });
    } catch (error) {
      console.error("Error in deleting storemenu:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  storePromotions: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: user_id, role: user_role } = (req as any).user;
      const pormotionList = await pgPool.query(
        `SELECT * FROM promotions WHERE store_id = $1`,
        [user_id]
      );
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown Error",
      });
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
  storePromotion: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id: store_id,
        role: user_role,
        auth: user_auth,
      } = (req as any).user;

      const { rows: promotions } = await pgPool.query(
        `SELECT * FROM promotions WHERE status = 'active'`
      );
      const { rows: selectedPromotions } = await pgPool.query(
        `SELECT promotion_one, promotion_two, promotion_three, promotion_four FROM stores WHERE id = $1`,
        [store_id]
      );

      res.status(200).json({
        message: "Success",
        promotions: promotions,
        promotion_one: selectedPromotions[0].promotion_one,
        promotion_two: selectedPromotions[0].promotion_two,
        promotion_three: selectedPromotions[0].promotion_three,
        promotion_four: selectedPromotions[0].promotion_four,
      });
    } catch (error) {
      console.error("Error in storeOrder:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  addPromotionToStore: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id: store_id,
        role: user_role,
        auth: user_auth,
      } = (req as any).user;
      const promotion_id = req.params.id;
      const { rows: selectedPromotions } = await pgPool.query(
        `SELECT promotion_one, promotion_two, promotion_three, promotion_four FROM stores WHERE id = $1`,
        [store_id]
      );
      if (selectedPromotions[0].promotion_one == null) {
        await pgPool.query(
          `UPDATE stores SET promotion_one = $1 WHERE id = $2`,
          [promotion_id, store_id]
        );
      } else if (selectedPromotions[0].promotion_two == null) {
        await pgPool.query(
          `UPDATE stores SET promotion_two = $1 WHERE id = $2`,
          [promotion_id, store_id]
        );
      } else if (selectedPromotions[0].promotion_three == null) {
        await pgPool.query(
          `UPDATE stores SET promotion_three = $1 WHERE id = $2`,
          [promotion_id, store_id]
        );
      } else if (selectedPromotions[0].promotoion_four == null) {
        await pgPool.query(
          `UPDATE stores SET promotion_four = $1 WHERE id = $2`,
          [promotion_id, store_id]
        );
      } else {
        res.status(404).json({
          message: "No enough space to add promotion",
        });
      }
      res.status(200).json({
        message: "added Successfully",
      });
    } catch (error) {
      console.error("Error in updating storemenu:", error);
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
  removePromotion: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id: store_id,
        role: user_role,
        auth: user_auth,
      } = (req as any).user;
      const promotion_id = req.params.id;
      const { rows: selectedPromotions } = await pgPool.query(
        `SELECT promotion_one, promotion_two, promotion_three, promotion_four FROM stores WHERE id = $1`,
        [store_id]
      );
      if (selectedPromotions[0].promotion_one == promotion_id) {
        await pgPool.query(
          `UPDATE stores SET promotion_one = $1 WHERE id = $2`,
          [null, store_id]
        );
      } else if (selectedPromotions[0].promotion_two == promotion_id) {
        await pgPool.query(
          `UPDATE stores SET promotion_two = $1 WHERE id = $2`,
          [null, store_id]
        );
      } else if (selectedPromotions[0].promotion_three == promotion_id) {
        await pgPool.query(
          `UPDATE stores SET promotion_three = $1 WHERE id = $2`,
          [null, store_id]
        );
      } else if (selectedPromotions[0].promotoion_four == promotion_id) {
        await pgPool.query(
          `UPDATE stores SET promotion_four = $1 WHERE id = $2`,
          [null, store_id]
        );
      } else {
        res.status(404).json({
          message: "No promotoin to remove",
        });
      }
      res.status(200).json({
        message: "removed Successfully",
      });
    } catch (error) {
      console.error("Error in updating storemenu:", error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
export default StoreController;

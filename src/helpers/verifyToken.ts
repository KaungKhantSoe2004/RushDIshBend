import { NextFunction, Request, Response } from "express";
const jwt = require("jsonwebtoken");
const verifyToken = (req: Request, res: Response, next: NextFunction): any => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        res.status(401).json({ message: "Unauthorized" });
      } else {
        const userId = decoded.id;
        const userRole = decoded.role;
        (req as any).user = {
          id: userId,
          role: userRole,
        };
        next();
      }
    });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

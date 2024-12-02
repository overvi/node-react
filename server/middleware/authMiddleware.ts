import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

const verifyToken = (req: any, res: Response, next: NextFunction) => {
  const token: string = req.headers.cookie;

  if (!token) {
    req.body.isAuthenticated = false;

    res.status(403).json({ message: "Access Denied" });
    return;
  }

  const parsedToken = token.substring(token.indexOf("=") + 1);

  verify(parsedToken, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      req.body.isAuthenticated = false;
      res.status(403).json({ message: "Access Denied" });
      return;
    }
    req.body.isAuthenticated = true;
    req.body.user = user;
    next();
  });
};

export default verifyToken;

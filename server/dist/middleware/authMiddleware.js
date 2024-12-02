"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
    const token = req.headers.cookie;
    if (!token) {
        req.body.isAuthenticated = false;
        res.status(403).json({ message: "Access Denied" });
        return;
    }
    const parsedToken = token.substring(token.indexOf("=") + 1);
    (0, jsonwebtoken_1.verify)(parsedToken, process.env.JWT_SECRET, (err, user) => {
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
exports.default = verifyToken;

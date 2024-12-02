"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.sendPasswordResetLink = exports.login = exports.signUp = void 0;
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const nodemailer_1 = require("nodemailer");
const User_1 = require("../models/User");
const catchError_1 = __importDefault(require("../utils/catchError"));
const joi_1 = __importDefault(require("joi"));
const Token_1 = __importDefault(require("../models/Token"));
const crypto_1 = require("crypto");
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { error: formError } = (0, User_1.validate)(req.body);
    if (formError) {
        return res.status(400).json({ message: "Invalid Input" });
    }
    const { email, password } = req.body;
    const [error, user] = yield (0, catchError_1.default)(User_1.User.findOne({ email }));
    if (error) {
        return res.status(500).json({ message: "Error occurred" });
    }
    if (user) {
        return res.status(409).json({ message: "email already exists" });
    }
    const hashedPassword = yield (0, bcryptjs_1.hash)(password, 10);
    const newUser = new User_1.User({ email, password: hashedPassword });
    yield newUser.save();
    res.status(201).json({ message: "User registered successfully" });
});
exports.signUp = signUp;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { error: formError } = (0, User_1.validate)(req.body);
    if (formError) {
        return res.status(400).json({ message: "Invalid Input" });
    }
    const { email, password } = req.body;
    const [error, user] = yield (0, catchError_1.default)(User_1.User.findOne({ email }));
    if (error) {
        return res.status(500).json({ message: "An Error Occurred" });
    }
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = yield (0, bcryptjs_1.compare)(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = (0, jsonwebtoken_1.sign)({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
    // Set token in an HttpOnly cookie
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Ensure secure in production
        sameSite: "strict",
        maxAge: 3600000, // 1 hour in milliseconds
    });
    res.json({
        message: "Login successful",
        user: {
            token,
            name: "Hi",
        },
    });
});
exports.login = login;
const sendPasswordResetLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const schema = joi_1.default.object({
        email: joi_1.default.string().email().required(),
    });
    const { error: formError } = schema.validate(req.body);
    if (formError) {
        return res.status(400).json({ message: "Invalid Input" });
    }
    const { email } = req.body;
    const user = yield User_1.User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User does not exist" });
    }
    let token = yield Token_1.default.findOne({ userId: user._id });
    if (!token) {
        token = yield new Token_1.default({
            userId: user._id,
            token: (0, crypto_1.randomBytes)(32).toString("hex"),
        }).save();
    }
    const sendEmail = (email, subject, text) => __awaiter(void 0, void 0, void 0, function* () {
        const transporter = (0, nodemailer_1.createTransport)({
            host: process.env.HOST,
            service: process.env.SERVICE,
            secure: true,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            },
        });
        const mailOptions = {
            from: process.env.USER,
            to: email,
            subject,
            text: "Yuta",
            html: ` <div>
      <h1
        style="
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
            Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
            sans-serif;
        "
      >
        Hi this is an email from Yuta
      </h1>
      <a
        style="
          text-decoration: none;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
            Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
            sans-serif;
          display: block;
          background-color: rgba(255, 99, 71, 0.6);
          padding: 1em;
          width: fit-content;
          border-radius: 0.6rem;
          font-weight: 500;
        "
        href=${text}
        >Reset Password</a
      >
    </div>`,
        };
        yield transporter.sendMail(mailOptions);
        return res.status(201).json({ message: "Email Sent" });
    });
    const link = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;
    return sendEmail(user.email, "Password reset", link);
});
exports.sendPasswordResetLink = sendPasswordResetLink;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const schema = joi_1.default.object({ password: joi_1.default.string().min(8).required() });
    const { error } = schema.validate(req.body);
    if (error)
        return res.status(400).json({ message: "Invalid Input" });
    const user = yield User_1.User.findById(req.params.userId);
    if (!user)
        return res.status(400).json({ message: "Invalid link " });
    const token = yield Token_1.default.findOne({
        userId: user._id,
        token: req.params.token,
    });
    if (!token)
        return res.status(400).send("Invalid link or expired");
    user.password = yield (0, bcryptjs_1.hash)(req.body.password, 10);
    yield user.save();
    yield token.deleteOne();
    return res.status(200).json({ message: "Password Changed" });
});
exports.resetPassword = resetPassword;

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
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const authController_1 = require("./controllers/authController");
const catchError_1 = __importDefault(require("./utils/catchError"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, dotenv_1.config)();
(0, db_1.default)();
const port = process.env.PORT;
app.post("/api/login", (req, res) => {
    (0, authController_1.login)(req, res);
});
app.post("/api/signup", (req, res) => {
    (0, authController_1.signUp)(req, res);
});
app.post("/api/reset-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [error, _] = yield (0, catchError_1.default)((0, authController_1.sendPasswordResetLink)(req, res));
    if (error)
        res.status(500).json({ message: "An Error Occurred" });
}));
app.patch("/api/:userId/:token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [error, _] = yield (0, catchError_1.default)((0, authController_1.resetPassword)(req, res));
    if (error)
        res.status(500).json({ message: "An Error Occurred" });
}));
app.listen(Number(port) || 3000, "::1", () => {
    console.log("Server Started Listening On " + port);
});

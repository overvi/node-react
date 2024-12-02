import { config } from "dotenv";
import express from "express";
import connectDB from "./config/db";
import {
  login,
  resetPassword,
  sendPasswordResetLink,
  signUp,
} from "./controllers/authController";
import verifyToken from "./middleware/authMiddleware";
import catchError from "./utils/catchError";

const app = express();

app.use(express.json());

config();
connectDB();

const port = process.env.PORT;

app.post("/api/login", (req, res) => {
  login(req, res);
});

app.post("/api/signup", (req, res) => {
  signUp(req, res);
});

app.post("/api/reset-password", async (req, res) => {
  const [error, _] = await catchError(sendPasswordResetLink(req, res));

  if (error) res.status(500).json({ message: "An Error Occurred" });
});

app.patch("/api/:userId/:token", async (req, res) => {
  const [error, _] = await catchError(resetPassword(req, res));

  if (error) res.status(500).json({ message: "An Error Occurred" });
});

app.listen(Number(port) || 3000, "::1", () => {
  console.log("Server Started Listening On " + port);
});

import { compare, hash } from "bcryptjs";
import { Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { createTransport } from "nodemailer";
import { User, validate } from "../models/User";
import catchError from "../utils/catchError";
import Joi from "joi";
import Token from "../models/Token";
import { randomBytes } from "crypto";

export const signUp = async (req: Request, res: Response) => {
  const { error: formError } = validate(req.body);
  if (formError) {
    return res.status(400).json({ message: "Invalid Input" });
  }
  const { email, password } = req.body;
  const [error, user] = await catchError(User.findOne({ email }));
  if (error) {
    return res.status(500).json({ message: "Error occurred" });
  }
  if (user) {
    return res.status(409).json({ message: "email already exists" });
  }
  const hashedPassword = await hash(password, 10);
  const newUser = new User({ email, password: hashedPassword });
  await newUser.save();
  res.status(201).json({ message: "User registered successfully" });
};
export const login = async (req: Request, res: Response) => {
  const { error: formError } = validate(req.body);

  if (formError) {
    return res.status(400).json({ message: "Invalid Input" });
  }
  const { email, password } = req.body;
  const [error, user] = await catchError(User.findOne({ email }));
  if (error) {
    return res.status(500).json({ message: "An Error Occurred" });
  }
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = sign({ id: user._id }, process.env.JWT_SECRET!, {
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
};
export const sendPasswordResetLink = async (req: Request, res: Response) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  const { error: formError } = schema.validate(req.body);
  if (formError) {
    return res.status(400).json({ message: "Invalid Input" });
  }
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User does not exist" });
  }
  let token = await Token.findOne({ userId: user._id });

  if (!token) {
    token = await new Token({
      userId: user._id,
      token: randomBytes(32).toString("hex"),
    }).save();
  }

  const sendEmail = async (email: string, subject: string, text: string) => {
    const transporter = createTransport({
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
    await transporter.sendMail(mailOptions);

    return res.status(201).json({ message: "Email Sent" });
  };

  const link = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;
  return sendEmail(user.email, "Password reset", link);
};

export const resetPassword = async (req: Request, res: Response) => {
  const schema = Joi.object({ password: Joi.string().min(8).required() });

  const { error } = schema.validate(req.body);

  if (error) return res.status(400).json({ message: "Invalid Input" });

  const user = await User.findById(req.params.userId);
  if (!user) return res.status(400).json({ message: "Invalid link " });

  const token = await Token.findOne({
    userId: user._id,
    token: req.params.token,
  });
  if (!token) return res.status(400).send("Invalid link or expired");

  user.password = await hash(req.body.password, 10);
  await user.save();
  await token.deleteOne();

  return res.status(200).json({ message: "Password Changed" });
};

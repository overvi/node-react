import Joi from "joi";
import { model, Schema } from "mongoose";

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = model("User", userSchema);

const validate = (user: any) => {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  return schema.validate(user);
};

export { User, validate };

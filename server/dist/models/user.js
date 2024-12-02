"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.User = void 0;
const joi_1 = __importDefault(require("joi"));
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const User = (0, mongoose_1.model)("User", userSchema);
exports.User = User;
const validate = (user) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string().required(),
        password: joi_1.default.string().required(),
    });
    return schema.validate(user);
};
exports.validate = validate;

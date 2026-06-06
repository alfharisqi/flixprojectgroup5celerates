import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const mailConfig = {
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === "true"
};

if (process.env.MAIL_USER && process.env.MAIL_PASS) {
  mailConfig.auth = {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  };
}

const transporter = nodemailer.createTransport(mailConfig);

export default transporter;

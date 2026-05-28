import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export default transporter;

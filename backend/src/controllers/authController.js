import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail, sendLoginNotificationEmail } from "../utils/sendEmail.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, dan password wajib diisi"
      });
    }

    const existingUser = await pool.query(
      "SELECT * FROM flix.users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "Email atau username sudah digunakan"
      });
    }

    const roleResult = await pool.query(
      "SELECT id_role FROM flix.roles WHERE role_name = $1",
      ["registered_user"]
    );

    const hashedPassword = await bcrypt.hash(password, 10);
    const roleId = roleResult.rows[0].id_role;

    const result = await pool.query(
      `INSERT INTO flix.users (id_role, username, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id_user, username, email`,
      [roleId, username, email, hashedPassword]
    );

    // kirim email welcome
    try {
      await sendWelcomeEmail(email, username);
    } catch (mailError) {
      console.error("Gagal kirim email register:", mailError.message);
    }

    return res.status(201).json({
      message: "Register berhasil",
      user: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan saat register",
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT 
          u.id_user,
          u.username,
          u.email,
          u.password,
          r.role_name
       FROM flix.users u
       JOIN flix.roles r ON u.id_role = r.id_role
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Password salah"
      });
    }

    const token = jwt.sign(
      {
        id_user: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role_name
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // kirim email notifikasi login
    try {
      await sendLoginNotificationEmail(user.email, user.username);
    } catch (mailError) {
      console.error("Gagal kirim email login:", mailError.message);
    }

    return res.json({
      message: "Login berhasil",
      token,
      user: {
        id_user: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role_name
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan saat login",
      error: error.message
    });
  }
};
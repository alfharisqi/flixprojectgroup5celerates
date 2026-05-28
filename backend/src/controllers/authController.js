import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendPasswordResetEmail
} from "../utils/sendEmail.js";

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getRegisteredUserRoleId = async () => {
  const roleResult = await pool.query(
    "SELECT id_role FROM flix.roles WHERE role_name = $1",
    ["registered_user"]
  );

  if (roleResult.rows.length > 0) {
    return roleResult.rows[0].id_role;
  }

  const insertedRole = await pool.query(
    `INSERT INTO flix.roles (role_name, description)
     VALUES ($1, $2)
     ON CONFLICT (role_name) DO UPDATE
       SET description = EXCLUDED.description
     RETURNING id_role`,
    ["registered_user", "User biasa yang sudah terdaftar"]
  );

  return insertedRole.rows[0].id_role;
};

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const roleId = await getRegisteredUserRoleId();

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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email wajib diisi"
      });
    }

    const userResult = await pool.query(
      `SELECT id_user, username, email
       FROM flix.users
       WHERE email = $1`,
      [email]
    );

    const genericMessage =
      "Jika email terdaftar, link reset password akan dikirim";

    if (userResult.rows.length === 0) {
      return res.json({
        message: genericMessage
      });
    }

    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await pool.query(
      `UPDATE flix.password_reset_tokens
       SET used_at = CURRENT_TIMESTAMP
       WHERE id_user = $1 AND used_at IS NULL`,
      [user.id_user]
    );

    await pool.query(
      `INSERT INTO flix.password_reset_tokens (id_user, token_hash, expires_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 minutes')`,
      [user.id_user, tokenHash]
    );

    await sendPasswordResetEmail(user.email, user.username, resetLink);

    return res.json({
      message: genericMessage
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memproses lupa password",
      error: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token dan password wajib diisi"
      });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({
        message: "Password minimal 6 karakter"
      });
    }

    const tokenHash = hashResetToken(token);

    const tokenResult = await pool.query(
      `SELECT prt.id_reset, prt.id_user
       FROM flix.password_reset_tokens prt
       WHERE prt.token_hash = $1
         AND prt.used_at IS NULL
         AND prt.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        message: "Token reset password tidak valid atau sudah kedaluwarsa"
      });
    }

    const resetToken = tokenResult.rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE flix.users
         SET password = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_user = $2`,
        [hashedPassword, resetToken.id_user]
      );

      await client.query(
        `UPDATE flix.password_reset_tokens
         SET used_at = CURRENT_TIMESTAMP
         WHERE id_reset = $1`,
        [resetToken.id_reset]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return res.json({
      message: "Password berhasil direset"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal reset password",
      error: error.message
    });
  }
};

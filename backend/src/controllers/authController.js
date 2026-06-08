import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  sendAccountVerificationEmail,
  sendLoginNotificationEmail,
  sendPasswordResetEmail
} from "../utils/sendEmail.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

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
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = hashToken(verificationToken);
    const frontendUrl = getFrontendUrl();
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    const client = await pool.connect();
    let newUser;

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO flix.users (id_role, username, email, password, email_verified)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING id_user, username, email, profile_image_url, banner_image_url, email_verified`,
        [roleId, username, email, hashedPassword]
      );

      newUser = result.rows[0];

      await client.query(
        `INSERT INTO flix.email_verification_tokens (id_user, token_hash, expires_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '24 hours')`,
        [newUser.id_user, verificationTokenHash]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    try {
      await sendAccountVerificationEmail(email, username, verificationLink);
    } catch (mailError) {
      console.error("Gagal kirim email verifikasi:", mailError.message);
    }

    return res.status(201).json({
      message: "Register berhasil. Cek email kamu untuk verifikasi akun.",
      user: newUser
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
          u.email_verified,
          u.is_active,
          u.is_premium,
          u.profile_image_url,
          u.banner_image_url,
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

    if (user.is_active === false) {
      return res.status(403).json({
        message: "Akun dinonaktifkan oleh admin."
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        message: "Akun belum diverifikasi. Silakan cek email untuk verifikasi akun."
      });
    }

    const token = jwt.sign(
      {
        id_user: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role_name,
        email_verified: user.email_verified,
        is_premium: user.is_premium
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
        role: user.role_name,
        email_verified: user.email_verified,
        is_premium: user.is_premium,
        profile_image_url: user.profile_image_url,
        banner_image_url: user.banner_image_url
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan saat login",
      error: error.message
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token = req.body?.token || req.query?.token;

    if (!token) {
      return res.status(400).json({
        message: "Token verifikasi wajib diisi"
      });
    }

    const tokenHash = hashToken(token);
    const tokenResult = await pool.query(
      `SELECT evt.id_verification, evt.id_user, evt.used_at, evt.expires_at, u.email_verified
       FROM flix.email_verification_tokens evt
       JOIN flix.users u ON u.id_user = evt.id_user
       WHERE evt.token_hash = $1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        message: "Token verifikasi tidak valid"
      });
    }

    const verificationToken = tokenResult.rows[0];

    if (verificationToken.email_verified) {
      return res.json({
        message: "Akun sudah terverifikasi. Kamu bisa login."
      });
    }

    if (verificationToken.used_at || new Date(verificationToken.expires_at) <= new Date()) {
      return res.status(400).json({
        message: "Token verifikasi sudah digunakan atau kedaluwarsa"
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE flix.users
         SET email_verified = TRUE,
             email_verified_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_user = $1`,
        [verificationToken.id_user]
      );

      await client.query(
        `UPDATE flix.email_verification_tokens
         SET used_at = CURRENT_TIMESTAMP
         WHERE id_verification = $1`,
        [verificationToken.id_verification]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return res.json({
      message: "Akun berhasil diverifikasi. Kamu bisa login sekarang."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal verifikasi akun",
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
    const tokenHash = hashToken(token);
    const frontendUrl = getFrontendUrl();
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

    const tokenHash = hashToken(token);

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

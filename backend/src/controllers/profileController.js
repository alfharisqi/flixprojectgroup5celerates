import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          u.id_user,
          u.username,
          u.email,
          r.role_name,
          u.created_at
       FROM flix.users u
       JOIN flix.roles r ON u.id_role = r.id_role
       WHERE u.id_user = $1`,
      [req.user.id_user]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil profile",
      error: error.message
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        message: "Username dan email wajib diisi"
      });
    }

    const checkUser = await pool.query(
      `SELECT id_user
       FROM flix.users
       WHERE (username = $1 OR email = $2)
         AND id_user <> $3`,
      [username, email, req.user.id_user]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        message: "Username atau email sudah digunakan user lain"
      });
    }

    let result;

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);

      result = await pool.query(
        `UPDATE flix.users
         SET username = $1,
             email = $2,
             password = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_user = $4
         RETURNING id_user, username, email`,
        [username, email, hashedPassword, req.user.id_user]
      );
    } else {
      result = await pool.query(
        `UPDATE flix.users
         SET username = $1,
             email = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_user = $3
         RETURNING id_user, username, email`,
        [username, email, req.user.id_user]
      );
    }

    return res.json({
      message: "Profile berhasil diperbarui",
      user: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal update profile",
      error: error.message
    });
  }
};
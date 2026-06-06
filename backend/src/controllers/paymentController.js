import pool from "../config/db.js";

export const upgradeToPremium = async (req, res) => {
  try {
    // Ambil ID User dari token login yang sedang aktif
    const userId = req.user?.id_user || req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({
          message: "User tidak teridentifikasi. Silakan login kembali.",
        });
    }

    const result = await pool.query(
      `UPDATE flix.users 
       SET is_premium = true, updated_at = CURRENT_TIMESTAMP 
       WHERE id_user = $1 
       RETURNING id_user, username, email, is_premium`,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    return res.status(200).json({
      message: "Pembayaran berhasil! Akun kamu sekarang Premium.",
      user: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memproses pembayaran premium.",
      error: error.message,
    });
  }
};

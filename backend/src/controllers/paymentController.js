import pool from "../config/db.js";

export const upgradeToPremium = async (req, res) => {
  try {
    // Ambil ID User dari token login yang didekode oleh middleware verifyToken
    const userId = req.user?.id_user || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "User tidak teridentifikasi. Silakan login kembali.",
      });
    }

    // 1. Ambil path file bukti pembayaran dari req.file
    const paymentProofPath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!paymentProofPath) {
      return res.status(400).json({
        message: "Bukti pembayaran wajib diunggah!",
      });
    }

    // 2. Update status premium dan path bukti transfer di database
    const result = await pool.query(
      `UPDATE flix.users 
       SET is_premium = true, payment_proof = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id_user = $2 
       RETURNING id_user, username, email, is_premium, payment_proof`,
      [paymentProofPath, userId],
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

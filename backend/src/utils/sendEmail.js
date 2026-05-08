import transporter from "../config/mail.js";

export const sendWelcomeEmail = async (toEmail, username) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: toEmail,
    subject: "Selamat datang di Flix",
    html: `
      <h2>Halo, ${username}!</h2>
      <p>Akun kamu berhasil dibuat di <b>Flix</b>.</p>
      <p>Sekarang kamu bisa login dan mulai membuat community post.</p>
    `
  });
};

export const sendLoginNotificationEmail = async (toEmail, username) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: toEmail,
    subject: "Notifikasi Login Akun Flix",
    html: `
      <h2>Halo, ${username}!</h2>
      <p>Akun Flix kamu baru saja login.</p>
      <p>Kalau ini bukan kamu, segera ganti password akunmu.</p>
    `
  });
};
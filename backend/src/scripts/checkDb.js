import pool from "../config/db.js";

const formatError = (error) => {
  if (error?.code === "ECONNREFUSED") {
    return `PostgreSQL tidak menerima koneksi di ${process.env.DB_HOST}:${process.env.DB_PORT}. Cek port PostgreSQL di pgAdmin atau Services.`;
  }

  if (error?.code === "28P01") {
    return `Password salah untuk user "${process.env.DB_USER}". Perbarui DB_PASSWORD di backend/.env sesuai password PostgreSQL.`;
  }

  if (error?.code === "3D000") {
    return `Database "${process.env.DB_NAME}" tidak ditemukan. Buat database ini di pgAdmin.`;
  }

  return error?.message || String(error);
};

try {
  const result = await pool.query(`
    SELECT
      current_database() AS database,
      current_schema() AS schema,
      inet_server_addr() AS host,
      inet_server_port() AS port
  `);

  console.log("Koneksi database berhasil:");
  console.table(result.rows);
} catch (error) {
  console.error("Koneksi database gagal:");
  console.error(formatError(error));
  process.exitCode = 1;
} finally {
  await pool.end();
}

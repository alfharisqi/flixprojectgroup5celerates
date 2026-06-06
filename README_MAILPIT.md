# Panduan Mailpit Untuk FLIX

Mailpit dipakai sebagai SMTP lokal untuk menangkap email dari backend FLIX. Dengan Mailpit, email verifikasi akun, notifikasi login, dan reset password bisa dicek lewat browser tanpa mengirim email ke alamat asli.

## 1. Fungsi Mailpit

Mailpit menggantikan layanan seperti Mailtrap saat development lokal.

Alur kerjanya:

1. Backend FLIX mengirim email lewat Nodemailer.
2. Nodemailer mengarah ke SMTP Mailpit di `localhost:1025`.
3. Mailpit menangkap email.
4. Email dapat dibuka di web inbox `http://localhost:8025`.

## 2. Konfigurasi Backend

Buka atau buat file:

```text
backend/.env
```

Isi konfigurasi email seperti ini:

```env
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM="FLIX Local <no-reply@flix.local>"
```

Catatan:

- `MAIL_HOST=localhost` karena Mailpit berjalan di komputer lokal.
- `MAIL_PORT=1025` adalah port SMTP Mailpit.
- `MAIL_SECURE=false` karena Mailpit lokal tidak memakai SSL.
- `MAIL_USER` dan `MAIL_PASS` dikosongkan karena Mailpit lokal tidak butuh login.

## 3. Menjalankan Mailpit Dengan Docker

Pastikan Docker Desktop sudah berjalan.

Dari root project `flix`, jalankan:

```bash
docker compose -f docker-compose.mailpit.yml up -d
```

Cek Mailpit:

```text
http://localhost:8025
```

Hentikan Mailpit:

```bash
docker compose -f docker-compose.mailpit.yml down
```

## 4. Menjalankan Mailpit Tanpa Docker di Windows

Jika Docker Desktop atau WSL bermasalah, install Mailpit langsung:

```powershell
winget install --id axllent.mailpit --source winget
```

Tutup PowerShell, buka terminal baru, lalu jalankan:

```powershell
mailpit
```

Mailpit akan berjalan di:

```text
SMTP server: localhost:1025
Web inbox: http://localhost:8025
```

Untuk menghentikan Mailpit dari terminal:

```powershell
Ctrl + C
```

## 5. Cara Testing Email FLIX

1. Jalankan Mailpit.
2. Jalankan backend FLIX:

```bash
cd backend
npm run dev
```

3. Jalankan frontend FLIX:

```bash
cd frontend
npm run dev
```

4. Buka website:

```text
http://localhost:5173
```

5. Coba salah satu fitur berikut:

- Register akun baru.
- Lupa password.
- Login untuk email notifikasi login.

6. Buka inbox Mailpit:

```text
http://localhost:8025
```

Email dari FLIX akan muncul di sana.

## 6. Troubleshooting

Jika email tidak muncul:

- Pastikan Mailpit aktif.
- Pastikan `backend/.env` memakai `MAIL_HOST=localhost` dan `MAIL_PORT=1025`.
- Restart backend setelah mengubah `.env`.
- Pastikan backend tidak masih memakai konfigurasi Mailtrap.
- Cek terminal backend, biasanya error SMTP akan muncul di log.

Jika Docker gagal karena WSL:

- Jalankan `wsl --update`, atau
- Pakai cara tanpa Docker dengan `winget install --id axllent.mailpit --source winget`.

Jika port bentrok:

- Pastikan tidak ada aplikasi lain yang memakai port `1025` atau `8025`.
- Hentikan proses Mailpit lama, lalu jalankan ulang.

## 7. File Terkait

```text
docker-compose.mailpit.yml
backend/.env.mailpit.example
backend/src/config/mail.js
backend/src/utils/sendEmail.js
```

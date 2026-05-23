
# FLIX

## 1. Cara Clone Website Ini

Clone repository dari GitHub:

```bash
git clone https://github.com/alfharisqi/flixprojectgroup5celerates.git
```

Masuk ke folder project:

```bash
cd flixprojectgroup5celerates
```

Install dependency backend:

```bash
cd backend
npm install
```

Install dependency frontend:

```bash
cd ../frontend
npm install
```

Buat file environment untuk backend di `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nama_database
DB_USER=postgres
DB_PASSWORD=password_database
JWT_SECRET=secret_jwt

MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=user_mailtrap
MAIL_PASS=password_mailtrap
MAIL_FROM=no-reply@flix.local

TMDB_API_KEY=api_key_tmdb
FRONTEND_URL=http://localhost:5173
```

Buat file environment untuk frontend di `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_GIPHY_API_KEY=api_key_giphy
```

Jalankan backend:

```bash
cd backend
npm run dev
```

Jalankan frontend di terminal lain:

```bash
cd frontend
npm run dev
```

Setelah berjalan, buka website di:

```text
http://localhost:5173
```

Backend API berjalan di:

```text
http://localhost:5000
```

## 2. API Yang Digunakan

### API Eksternal

| API | Fungsi | Lokasi Penggunaan |
| --- | --- | --- |
| TMDB API | Mengambil data film, TV series, genre, trending, popular, detail, trailer, cast, rekomendasi, dan watch provider. | Backend `movieController.js` dan `tvController.js` |
| TMDB Image API | Menampilkan poster dan backdrop film/series. | Frontend dan hasil mapping backend |
| GIPHY API | Mencari dan menampilkan GIF pada editor post komunitas. | Frontend `GifPickerModal.jsx` |
| SMTP/Mailtrap via Nodemailer | Mengirim email reset password. | Backend `mail.js` dan `sendEmail.js` |

### API Internal Backend

Base URL lokal:

```text
http://localhost:5000
```

Endpoint utama:

| Endpoint | Method | Fungsi |
| --- | --- | --- |
| `/api/auth/register` | POST | Registrasi user baru |
| `/api/auth/login` | POST | Login dan mendapatkan JWT |
| `/api/auth/forgot-password` | POST | Mengirim link reset password ke email |
| `/api/auth/reset-password` | POST | Mengatur password baru |
| `/api/profile/me` | GET, PUT | Melihat dan mengubah profile user login |
| `/api/movies/*` | GET | Search, popular, top rated, now playing, upcoming, trending, genre, discover, detail, video, cast, provider, rekomendasi film |
| `/api/tv-series/*` | GET | Search, popular, top rated, on the air, trending, genre, discover, detail, video, provider TV series |
| `/api/posts` | GET, POST | Melihat dan membuat post komunitas |
| `/api/posts/:id` | GET, DELETE | Detail post dan hapus post |
| `/api/comments/:postId` | GET, POST | Melihat dan membuat komentar/reply |
| `/api/post-likes/:postId` | POST | Like/unlike post |
| `/api/post-reactions/:postId` | POST | Memberikan reaction ke post |
| `/api/post-shares/:postId` | POST | Mencatat share post |
| `/api/post-views/:postId` | POST | Mencatat view post |
| `/api/post-insights/:postId` | GET | Statistik post seperti view, like, komentar, share, reaction, dan polling |
| `/api/polls/post/:postId` | GET | Mengambil polling berdasarkan post |
| `/api/polls/:pollId/vote` | POST | Vote polling |
| `/api/uploads/editor-image` | POST | Upload gambar dari rich text editor |
| `/api/movie-reviews/:movieId` | GET, POST | Melihat dan membuat review film |
| `/api/movie-reviews/likes/:reviewId` | POST | Like/unlike review film |
| `/api/tv-series-reviews/:seriesId` | GET, POST | Melihat dan membuat review TV series |
| `/api/tv-series-reviews/likes/:reviewId` | POST | Like/unlike review TV series |
| `/api/admin/dashboard` | GET | Dashboard khusus admin |
| `/api/moderator/dashboard` | GET | Dashboard moderator dan admin |

Beberapa endpoint membutuhkan header authorization:

```text
Authorization: Bearer <token>
```

## 3. Deskripsi Website

FLIX dibuat sebagai platform rekomendasi tontonan. User dapat mencari film atau TV series, melihat detail lengkap, membaca trailer/cast/provider streaming, lalu berdiskusi melalui fitur komunitas dan review.

### Fitur Utama

- Rekomendasi film berdasarkan mood, seperti Santai, Seru, Sedih, Menegangkan, Romantis, dan Pikiran.
- Homepage dengan hero film hits, carousel rekomendasi, filter genre, filter platform streaming, dan sorting.
- Halaman Movies untuk mencari dan menelusuri film dari TMDB.
- Halaman TV Series untuk mencari dan menelusuri series dari TMDB.
- Halaman Genre untuk eksplorasi konten berdasarkan genre.
- Detail film dan TV series berisi poster, backdrop, sinopsis, rating, genre, trailer, cast, rekomendasi, dan watch provider.
- Review film dan TV series dengan rating 1 sampai 5, reply review, dan like review.
- Community page untuk melihat post dari user lain.
- Create post dengan rich text editor, upload gambar, tag, GIF, dan polling.
- Detail post dengan komentar, reply komentar, like, reaction, share, view, dan insight.
- Polling komunitas dengan pilihan vote.
- Profile user untuk melihat dan mengubah data akun.
- Autentikasi user menggunakan register, login, JWT, forgot password, dan reset password.
- Role user terdiri dari `registered_user`, `moderator`, dan `admin`.
- Moderator dan admin dapat mengakses dashboard sesuai role.
- Moderator/admin atau owner post dapat menghapus post.

## 4. Teknologi Yang Digunakan

### Frontend

- React 19
- Vite
- React Router DOM
- Axios
- Tiptap Rich Text Editor
- Emoji Picker React
- React Icons

### Backend

- Node.js
- Express 5
- PostgreSQL
- JSON Web Token
- Bcrypt
- Multer
- Nodemailer
- Dotenv
- CORS

## 5. Struktur Folder

```text
flix/
  backend/
    src/
      config/
      controllers/
      middleware/
      routes/
      utils/
    sql/
    uploads/
  frontend/
    src/
      assets/
      components/
      pages/
    public/
```

## 6. Catatan Database

Backend menggunakan schema PostgreSQL bernama `flix`. Beberapa tabel tambahan dibuat otomatis saat backend dijalankan, seperti:

- `flix.password_reset_tokens`
- `flix.post_views`
- `flix.movie_reviews`
- `flix.movie_review_likes`
- `flix.tv_series_reviews`
- `flix.tv_series_review_likes`

File SQL tambahan tersedia di folder `backend/sql`.

Pastikan tabel utama seperti `users`, `roles`, `posts`, `comments`, `post_likes`, `post_reactions`, `post_shares`, `post_polls`, `post_poll_options`, dan `post_poll_votes` sudah tersedia agar semua fitur komunitas berjalan.


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
| SMTP/Mailtrap via Nodemailer | Mengirim email verifikasi akun dan reset password. | Backend `mail.js` dan `sendEmail.js` |

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
| `/api/auth/verify-email` | GET, POST | Verifikasi akun dari token email |
| `/api/auth/forgot-password` | POST | Mengirim link reset password ke email |
| `/api/auth/reset-password` | POST | Mengatur password baru |
| `/api/chats/conversations` | GET | Mengambil inbox private chat user login |
| `/api/chats/conversations/:userId` | POST | Membuka atau membuat chat dengan teman |
| `/api/chats/conversations/:conversationId/messages` | GET, POST | Mengambil dan mengirim pesan private chat |
| `/api/friends` | GET | Mengambil friendlist user login |
| `/api/friends/ids` | GET | Mengambil daftar ID teman user login |
| `/api/friends/requests` | GET | Mengambil request pertemanan masuk |
| `/api/friends/requests/:friendId/accept` | PUT | Menerima request pertemanan |
| `/api/friends/requests/:friendId/decline` | DELETE | Menolak request pertemanan |
| `/api/friends/:userId` | POST, DELETE | Mengirim request pertemanan atau menghapus teman |
| `/api/profile/me` | GET, PUT | Melihat dan mengubah profile user login |
| `/api/profile/activity` | GET | Mengambil ringkasan aktivitas user login |
| `/api/profile/media` | PUT | Menyimpan URL foto profile dan banner user |
| `/api/movies/*` | GET | Search, popular, top rated, now playing, upcoming, trending, genre, discover, detail, video, cast, provider, rekomendasi film |
| `/api/tmdb/*` | GET | Alias untuk endpoint movie/TMDB |
| `/api/tv-series/*` | GET | Search, popular, top rated, on the air, trending, genre, discover, detail, video, provider TV series |
| `/api/tv-series/:id/seasons/:seasonNumber` | GET | Mengambil daftar episode berdasarkan season TV series |
| `/api/tv/*` | GET | Alias untuk endpoint TV series |
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
| `/api/notifications` | GET | Mengambil notifikasi user login |
| `/api/notifications/:id/read` | PUT | Menandai satu notifikasi sudah dibaca |
| `/api/notifications/read-all` | PUT | Menandai semua notifikasi sudah dibaca |
| `/api/uploads/editor-image` | POST | Upload gambar dari rich text editor |
| `/api/movie-reviews/:movieId` | GET, POST | Melihat dan membuat review film |
| `/api/movie-reviews/:reviewId` | PUT, DELETE | Mengubah dan menghapus review film milik user |
| `/api/movie-reviews/likes/:reviewId` | POST | Like/unlike review film |
| `/api/tv-series-reviews/:seriesId` | GET, POST | Melihat dan membuat review TV series |
| `/api/tv-series-reviews/:reviewId` | PUT, DELETE | Mengubah dan menghapus review TV series milik user |
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
- Detail TV series memiliki pilihan season, daftar episode, dan checklist episode yang sudah ditonton.
- Review film dan TV series dengan rating 1 sampai 5, reply review, dan like review.
- Review film dan TV series milik user dapat diedit dan dihapus dari halaman profile.
- Search modal untuk mencari film dan TV series dari navbar.
- Watchlist film dan TV series dengan status sudah ditonton atau belum ditonton.
- Watchlist TV series memiliki pilihan season dan dropdown episode untuk menandai progres tontonan per episode.
- Checklist episode memakai pola progres berurutan: jika episode 3 ditandai, episode 1 sampai 3 ikut tertandai; jika progres diturunkan, episode setelahnya ikut dibatalkan.
- Community page untuk melihat post dari user lain.
- Popup Add Friend / Message / Report User pada nama user post dan reply Community.
- Request pertemanan masuk dengan tombol Accept / Decline di halaman Profile.
- Friendlist di halaman Profile dan private chat antar teman yang tersimpan di PostgreSQL.
- Create post dengan rich text editor, upload gambar, tag, GIF, dan polling.
- Detail post dengan komentar, reply komentar, like, reaction, share, view, dan insight.
- Polling komunitas dengan pilihan vote.
- Notifikasi untuk interaksi pada post, komentar, reply, share, reaction, dan polling user.
- Profile user untuk melihat aktivitas, review, postingan, statistik watchlist, mengubah data akun, foto profile, dan banner.
- Autentikasi user menggunakan register, login, JWT, forgot password, dan reset password.
- Pop up konfirmasi untuk logout, simpan watchlist, dan hapus item watchlist.
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
      app/
      assets/
      components/
        community/
        editor/
        layout/
        routing/
        ui/
      features/
        admin/
        auth/
        community/
        genre/
        home/
        movies/
        profile/
        tv-series/
        watchlist/
      utils/
    public/
```

Frontend menggunakan alias import `@/` yang mengarah ke `frontend/src`.

## 6. Catatan Database

Backend menggunakan schema PostgreSQL bernama `flix`. Beberapa tabel tambahan dibuat otomatis saat backend dijalankan, seperti:

- `flix.password_reset_tokens`
- `flix.post_views`
- `flix.movie_reviews`
- `flix.movie_review_likes`
- `flix.tv_series_reviews`
- `flix.tv_series_review_likes`
- `flix.notifications`
- `flix.user_friends`
- `flix.chat_conversations`
- `flix.chat_messages`
- Kolom `profile_image_url` dan `banner_image_url` pada `flix.users`

File SQL tambahan tersedia di folder `backend/sql`.

Pastikan tabel utama seperti `users`, `roles`, `posts`, `comments`, `post_likes`, `post_reactions`, `post_shares`, `post_polls`, `post_poll_options`, dan `post_poll_votes` sudah tersedia agar semua fitur komunitas berjalan.

Saat ini data watchlist disimpan di frontend melalui `localStorage` dengan key berdasarkan user login:

- `flix_movie_watchlist_<id_user>` untuk daftar film tersimpan
- `flix_tv_watchlist_<id_user>` untuk daftar TV series tersimpan
- `flix_watchlist_status_<id_user>` untuk status sudah/belum ditonton

Format status watchlist:

- `movie:<movie_id>` untuk status film
- `tv:<series_id>` untuk status selesai seluruh TV series
- `tv:<series_id>:s<season_number>:e<episode_number>` untuk status episode TV series

Progress episode TV series dibuat berurutan. Contoh: jika user menandai episode 3, maka episode 1, 2, dan 3 ikut tersimpan sebagai sudah ditonton. Jika ingin watchlist tersimpan permanen lintas device, perlu dibuat tabel dan endpoint watchlist di backend.

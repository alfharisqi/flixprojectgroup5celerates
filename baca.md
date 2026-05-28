# Penjelasan Folder `backend/sql`

Folder `backend/sql` dibuat untuk menyimpan script SQL tambahan yang berhubungan dengan struktur database backend.

Isi folder ini bukan kode JavaScript yang dijalankan langsung oleh React atau Express. File-file di dalamnya adalah catatan/migration SQL yang bisa dipakai untuk membuat tabel tertentu secara manual di PostgreSQL jika dibutuhkan.

## Isi Folder

### `post_views.sql`

File ini membuat tabel `flix.post_views`.

Fungsinya untuk menyimpan data siapa saja yang sudah melihat sebuah post komunitas. Data ini dipakai untuk fitur statistik/insight post, misalnya jumlah view pada post.

Tabel ini berhubungan dengan:

- `flix.posts`
- `flix.users`

### `password_resets.sql`

File ini membuat tabel `flix.password_reset_tokens`.

Fungsinya untuk menyimpan token reset password saat user memakai fitur lupa password. Token disimpan dalam bentuk hash, punya waktu kedaluwarsa, dan bisa ditandai sudah dipakai.

Tabel ini berhubungan dengan:

- `flix.users`

### `movie_reviews.sql`

File ini membuat tabel:

- `flix.movie_reviews`
- `flix.movie_review_likes`

Fungsinya untuk menyimpan review film dari user, rating 1 sampai 5, reply review, dan like pada review.

Tabel ini berhubungan dengan:

- `flix.users`
- data movie dari TMDB melalui `tmdb_movie_id`

## Apakah Folder Ini Wajib Ada?

Ya, folder ini berguna sebagai dokumentasi struktur database tambahan dan backup script SQL.

Namun pada kode backend sekarang, beberapa tabel tambahan juga dibuat otomatis saat server dijalankan melalui file di `backend/src/config`, misalnya:

- `initPostViews.js`
- `initPasswordReset.js`
- `initMovieReviews.js`
- `initTvSeriesReviews.js`

Jadi folder `backend/sql` lebih berfungsi sebagai script manual/referensi. Kalau database baru belum punya tabel-tabel tersebut, kamu bisa menjalankan file SQL ini di pgAdmin, atau cukup jalankan backend jika fitur auto-init sudah mencakup tabelnya.

## Hubungannya Dengan `flix_db.sql`

`flix_db.sql` di root project adalah dump/schema database utama yang lebih lengkap.

Sedangkan folder `backend/sql` berisi script kecil per fitur. Biasanya dipakai ketika hanya ingin menambahkan tabel tertentu tanpa import ulang seluruh database.

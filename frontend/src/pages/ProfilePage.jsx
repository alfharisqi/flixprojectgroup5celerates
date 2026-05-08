import { useEffect, useState } from "react";
import axios from "axios";

function ProfilePage() {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/profile/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setForm({
        username: res.data.username || "",
        email: res.data.email || "",
        password: "",
      });
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengambil profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/profile/me`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const oldUser = JSON.parse(localStorage.getItem("user"));

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...oldUser,
          username: res.data.user.username,
          email: res.data.user.email,
        }),
      );

      alert(res.data.message);
      setForm((prev) => ({
        ...prev,
        password: "",
      }));

      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal update profile");
    }
  };

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading profile...</div>;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
      <h1>Edit Profile</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
        />

        <label>Password Baru (opsional)</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Kosongkan jika tidak ingin ganti password"
        />

        <button type="submit">Simpan Perubahan</button>
      </form>
    </div>
  );
}

export default ProfilePage;

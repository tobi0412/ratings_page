"use client";

import { signUp } from "@/actions/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signUp(email, password, username);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(
        "¡Registro exitoso! Tu perfil está pendiente de aprobación por el admin.",
      );
      setTimeout(() => router.push("/auth/login"), 2500);
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
    >
      <div>
        <label className="label-sport" htmlFor="username">
          Nombre de jugador
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-sport"
          placeholder="tu_nombre"
          required
        />
      </div>

      <div>
        <label className="label-sport" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-sport"
          placeholder="tu@email.com"
          required
        />
      </div>

      <div>
        <label className="label-sport" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-sport"
          placeholder="••••••••"
          required
        />
      </div>

      {error && (
        <div
          style={{
            background: "rgba(255,82,82,0.1)",
            border: "1px solid rgba(255,82,82,0.3)",
            borderRadius: "6px",
            padding: "0.6rem 0.8rem",
            color: "#ff5252",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "rgba(0,230,118,0.1)",
            border: "1px solid rgba(0,230,118,0.3)",
            borderRadius: "6px",
            padding: "0.6rem 0.8rem",
            color: "#00e676",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "0.85rem",
          }}
        >
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-lime"
        style={{ width: "100%", marginTop: "0.25rem" }}
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}

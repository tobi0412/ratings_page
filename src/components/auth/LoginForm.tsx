"use client";

import { signIn } from "@/actions/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
    >
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

      <button
        type="submit"
        disabled={loading}
        className="btn-lime"
        style={{ width: "100%", marginTop: "0.25rem" }}
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

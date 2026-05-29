import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          background:
            "radial-gradient(ellipse, rgba(0,230,118,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-slide-up"
        style={{
          width: "100%",
          maxWidth: "400px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo mark */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(0,230,118,0.1)",
              border: "1px solid rgba(0,230,118,0.25)",
              fontSize: "2rem",
              marginBottom: "1rem",
            }}
          >
            ⚽
          </div>
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "2.8rem",
              letterSpacing: "0.08em",
              color: "#e4f0e8",
              margin: 0,
              lineHeight: 1,
            }}
          >
            BIENVENIDO
          </h1>
          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.85rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#3d6e50",
              marginTop: "0.35rem",
            }}
          >
            Ingresá a tu cuenta
          </p>
        </div>

        {/* Card */}
        <div className="card-sport stripe-texture" style={{ padding: "2rem" }}>
          <LoginForm />

          <hr className="divider-sport" style={{ margin: "1.5rem 0" }} />

          <p
            style={{
              textAlign: "center",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.88rem",
              color: "#3d6e50",
              margin: 0,
            }}
          >
            ¿No tenés cuenta?{" "}
            <Link
              href="/auth/register"
              style={{
                color: "#00e676",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

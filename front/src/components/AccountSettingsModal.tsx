import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../utils/apiUrl";

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const handleDeactivateAccount = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/api/user/deactivateAccount"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user?._id })
      });

      if (!response.ok) {
        throw new Error("Error al desactivar cuenta");
      }

      // Logout y redirigir
      logout();
      navigate("/login");
    } catch (err) {
      setError("Error al desactivar la cuenta");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/api/user/deleteAccount"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user?._id })
      });

      if (!response.ok) {
        throw new Error("Error al eliminar cuenta");
      }

      // Logout y redirigir
      logout();
      navigate("/login");
    } catch (err) {
      setError("Error al eliminar la cuenta");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#202c33",
          borderRadius: "10px",
          padding: "30px",
          maxWidth: "400px",
          border: "1px solid #3b4a54"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confirmación de desactivación */}
        {showDeactivateConfirm ? (
          <>
            <h2 style={{ marginTop: 0, color: "#e9edef", textAlign: "center" }}>
              ¿Desactivar Cuenta?
            </h2>

            <div style={{ backgroundColor: "#1a2630", padding: "15px", borderRadius: "5px", marginBottom: "20px" }}>
              <p style={{ color: "#bbb", margin: 0, lineHeight: "1.5" }}>
                Tu cuenta será desactivada. Podrás reactivarla en cualquier momento iniciando sesión.
              </p>
            </div>

            {error && (
              <p style={{ color: "#ff4444", textAlign: "center", marginBottom: "15px" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#3b4a54",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleDeactivateAccount}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: loading ? "#6a4a4a" : "#ff9800",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Procesando..." : "Desactivar"}
              </button>
            </div>
          </>
        ) : showDeleteConfirm ? (
          <>
            <h2 style={{ marginTop: 0, color: "#ff4444", textAlign: "center" }}>
              ⚠️ Eliminar Cuenta Permanentemente
            </h2>

            <div style={{ backgroundColor: "#2a1a1a", padding: "15px", borderRadius: "5px", marginBottom: "20px", border: "1px solid #8b4444" }}>
              <p style={{ color: "#ff9999", margin: 0, lineHeight: "1.5" }}>
                Esta acción es <strong>IRREVERSIBLE</strong>. Se eliminarán todos tus datos, conversaciones y mensajes de forma permanente.
              </p>
            </div>

            {error && (
              <p style={{ color: "#ff4444", textAlign: "center", marginBottom: "15px" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#3b4a54",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: loading ? "#6a2a2a" : "#ff4444",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Eliminando..." : "Eliminar Permanente"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 0, color: "#e9edef", textAlign: "center" }}>
              Configuración de Cuenta
            </h2>

            <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #3b4a54" }}>
              <p style={{ color: "#bbb", margin: "5px 0" }}>
                <strong>Email:</strong> {user?.email}
              </p>
              <p style={{ color: "#bbb", margin: "5px 0" }}>
                <strong>Nombre:</strong> {user?.name}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => setShowDeactivateConfirm(true)}
                style={{
                  padding: "12px",
                  backgroundColor: "#ff9800",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                🔒 Desactivar Cuenta
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: "12px",
                  backgroundColor: "#ff4444",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                🗑️ Eliminar Cuenta Permanentemente
              </button>

              <button
                onClick={onClose}
                style={{
                  padding: "12px",
                  backgroundColor: "#3b4a54",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

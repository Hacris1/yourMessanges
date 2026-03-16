import { useEffect, useState } from "react";
import forge from "node-forge";
import { useRSA } from "../hooks/useRSA";
import { useAuth } from "../context/AuthContext";
import { buildApiUrl } from "../utils/apiUrl";

interface RegenerateKeysModalProps {
  userId: string;
  token: string;
  onKeysSaved: () => void;
}

export function RegenerateKeysModal({ userId, token, onKeysSaved }: RegenerateKeysModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { generateNewKeys, loadKeysFromStorage } = useRSA();
  const { user, setAuth } = useAuth();

  const handleRegenerateKeys = async () => {
    setLoading(true);
    setError("");

    try {
      const oldPrivateKey = localStorage.getItem("privateKeyPem");
      if (oldPrivateKey) {
        const oldKeysArray = JSON.parse(localStorage.getItem("oldPrivateKeys") || "[]");
        oldKeysArray.push(oldPrivateKey);
        localStorage.setItem("oldPrivateKeys", JSON.stringify(oldKeysArray));
      }
      
      // Generar nuevas claves RSA localmente
      const { publicKeyPem } = generateNewKeys();

      // Enviar clave pública al backend
      const response = await fetch(buildApiUrl("/api/user/regenerateKeys"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          publicKey: publicKeyPem
        })
      });

      if (!response.ok) {
        throw new Error("Error al regenerar claves");
      }

      const data = await response.json();

      // Actualizar el contexto con la nueva publicKey
      if (user && token) {
        setAuth(token, {
          ...user,
          publicKey: data.user.publicKey
        });
      }

      // Cargar claves en el hook
      loadKeysFromStorage();

      // Cerrar modal
      setIsOpen(false);
      onKeysSaved();
    } catch (err) {
      setError("Error al regenerar claves. Intenta de nuevo.");
      console.error((err as any)?.message);
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
    >
      <div
        style={{
          backgroundColor: "#202c33",
          borderRadius: "10px",
          padding: "30px",
          maxWidth: "400px",
          textAlign: "center",
          border: "1px solid #3b4a54"
        }}
      >
        <h2 style={{ marginTop: 0, color: "#e9edef" }}>
          Configurar Clave de Encriptación
        </h2>

        <p style={{ color: "#bbb", lineHeight: "1.6" }}>
          Para poder enviar y recibir mensajes encriptados, necesitas generar tu clave de encriptación personal. 
          Esta clave se guardará en tu navegador y nunca será compartida.
        </p>

        <div
          style={{
            backgroundColor: "#1a2630",
            padding: "15px",
            borderRadius: "5px",
            marginBottom: "20px",
            border: "1px solid #3b4a54"
          }}
        >
          <p style={{ color: "#7a8a94", fontSize: "13px", margin: 0 }}>
            ⚠️ Si borras los datos de tu navegador, perderás acceso a tus conversaciones anteriores.
            (Como en WhatsApp sin backup)
          </p>
        </div>

        {error && (
          <p style={{ color: "#ff4444", marginBottom: "15px" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleRegenerateKeys}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: loading ? "#3b4a54" : "#00a884",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "600"
          }}
        >
          {loading ? "Generando..." : "Generar mi Clave"}
        </button>

        <p style={{ color: "#7a8a94", fontSize: "12px", marginTop: "15px" }}>
          Esto tardar​á algunos segundos...
        </p>
      </div>
    </div>
  );
}

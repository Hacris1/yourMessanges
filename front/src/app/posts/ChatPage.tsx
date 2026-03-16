import { useState, useEffect } from "react";
import { UsersList } from "./listUsers";
import ChatContainer from "./chatContainer";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useRSA } from "../../hooks/useRSA";
import forge from "node-forge";
import { jwtDecode } from "jwt-decode";
import { buildApiUrl } from "../../utils/apiUrl";
import { AccountSettingsModal } from "../../components/AccountSettingsModal";

type TokenPayload = {
  id: string;
  name: string;
  email: string;
  publicKey: string;
  exp: number;
};

type User = {
  _id: string;
  name: string;
  email: string;
  publicKey?: string;
};

export default function ChatPage() {

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const { logout, token, user } = useAuth(); 
  const navigate = useNavigate();

  const { publicKey, privateKey } = useRSA();

  useEffect(() => {
    // El componente está montado y listo
  }, [user, privateKey, publicKey]);

  const handleLogout = () => {

    logout();
    navigate("/login");

  };

  return (

    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#0b141a", color: "#e9edef" }}>
      {/* Modal de configuración de cuenta */}
      <AccountSettingsModal
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#202c33",
        borderBottom: "1px solid #1f2c34"
      }}>
        <h1 style={{ margin: 0, fontSize: "22px", color: "#e9edef" }}>Your Messages</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => setShowAccountSettings(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2a3942",
              color: "white",
              border: "1px solid #3b4a54",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            ⚙️ Configuración
          </button>
          <button 
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2a3942",
              color: "white",
              border: "1px solid #3b4a54",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* CONTENIDO */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          padding: "20px",
          flex: 1,
          overflow: "hidden",
          backgroundColor: "#0b141a"
        }}
      >

        {/* PANEL USUARIOS */}
        <div className="users-panel">
          <UsersList onSelect={setSelectedUser} />
        </div>

        {/* CHAT */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex"
          }}
        >
          <ChatContainer user={selectedUser} />
        </div>

      </div>

    </div>

  );

}
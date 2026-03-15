import { useState, useEffect } from "react";
import { UsersList } from "./listUsers";
import ChatContainer from "./chatContainer";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useRSA } from "../../hooks/useRSA";
import forge from "node-forge";

type User = {
  _id: string;
  name: string;
  email: string;
  publicKey?: string; // claves de otros usuarios
};

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { publicKey, privateKey } = useRSA(); 

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  //  enviar tu publicKey al backend
  useEffect(() => {
    if (publicKey) {
      // convertir a PEM y guardarla en tu backend
      const myPublicKeyPem = forge.pki.publicKeyToPem(publicKey);
      console.log("Enviar tu publicKey al backend:", myPublicKeyPem);
    }
  }, [publicKey]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header con logout */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#f0f0f0",
        borderBottom: "1px solid #ddd"
      }}>
        <h1>Your Messages</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Contenido  */}
      <div style={{ display: "flex", gap: "20px", padding: "20px", flex: 1, overflow: "hidden" }}>
        <div style={{ width: "300px", borderRight: "1px solid #ddd", overflowY: "auto" }}>
          <UsersList onSelect={setSelectedUser} />
        </div>

        <div style={{ flex: 1 }}>
          <ChatContainer 
            user={selectedUser} 
            myPrivateKey={privateKey} 
            myPublicKey={publicKey} 
          />
        </div>
      </div>
    </div>
  );
}
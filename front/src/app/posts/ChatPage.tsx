import { useState, useEffect } from "react";
import { UsersList } from "./listUsers";
import ChatContainer from "./chatContainer";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useRSA } from "../../hooks/useRSA";
import forge from "node-forge";
import { jwtDecode } from "jwt-decode";
import { buildApiUrl } from "../../utils/apiUrl";

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
  const { logout, token } = useAuth();
  const navigate = useNavigate();

  const { publicKey, privateKey } = useRSA();

  let currentUserId: string | null = null;

  if (token) {
    const decoded = jwtDecode<TokenPayload>(token);
    currentUserId = decoded.id;
  }

  useEffect(() => {

    if (publicKey && currentUserId) {

      const publicKeyPem = forge.pki.publicKeyToPem(publicKey);

      fetch(buildApiUrl("/api/user/updatePublickey"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUserId,
          publicKey: publicKeyPem
        })
      })
      .then(async (res) => {

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "No se pudo guardar la public key");
        }

        return data;

      })
      .then(data => console.log("Public key enviada:", data?.message || "ok"))
      .catch(err => console.error("Error enviando public key", err));

    }

  }, [publicKey, currentUserId, token]);

  const handleLogout = () => {

    logout();
    navigate("/login");

  };

  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#0b141a",
        color: "#e9edef"
      }}
    >

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "#202c33",
          borderBottom: "1px solid #1f2c34"
        }}
      >
        <h1 style={{ margin: 0, fontSize: "22px" }}>
          Your Messages
        </h1>

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
          <ChatContainer
            user={selectedUser}
            myPrivateKey={privateKey}
            myPublicKey={publicKey}
            token={token || ""}
          />
        </div>

      </div>

    </div>

  );

}
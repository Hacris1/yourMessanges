import { useState, useEffect } from "react";
import forge from "node-forge";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";

type User = {
  _id: string;
  name: string;
  email: string;
  publicKey?: string;
};

type Message = {
  _id: string;
  content: string;
  emisor: {
    _id: string;
    name: string;
  };
  date: string;
};

type ChatContainerProps = {
  user: User | null;
  myPrivateKey: forge.pki.rsa.PrivateKey | null;
  myPublicKey: forge.pki.rsa.PublicKey | null;
  token: string; // JWT para requests
};

export default function ChatContainer({ user, myPrivateKey }: ChatContainerProps) {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { sendMessage: emitMessage, onMessageReceived } = useSocket(currentUser?._id || null);

  useEffect(() => {
    if (!onMessageReceived) return;

    const unsubscribe = onMessageReceived((message: Message) => {

      if (myPrivateKey && message.content) {
        try {
          const decoded = forge.util.decode64(message.content);
          const decrypted = myPrivateKey.decrypt(decoded, "RSA-OAEP");
          message.content = decrypted;
        } catch (err) {
          console.error("Error descifrando mensaje:", err);
        }
      }
      
      setMessages(prev => [...prev, message]);
    });

    return unsubscribe;
  }, [myPrivateKey, onMessageReceived]);

  const sendMessage = () => {
    if (!input.trim() || !user?.publicKey || !currentUser) return;

    setLoading(true);

    try {
      const recipientPublicKey = forge.pki.publicKeyFromPem(user.publicKey);
      const encrypted = recipientPublicKey.encrypt(input, "RSA-OAEP");
      const encoded = forge.util.encode64(encrypted);

      // Enviar via WebSocket
      emitMessage({
        emisor: currentUser._id,
        receptor: user._id,
        content: input,
        encryptedContent: encoded
      });

      // Mostrar el mensaje localmente
      setMessages(prev => [...prev, {
        _id: Date.now().toString(),
        content: input,
        emisor: {
          _id: currentUser._id,
          name: currentUser.name
        },
        date: new Date().toISOString()
      }]);

      setInput("");
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999" }}>
        Selecciona un usuario para chatear
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "10px", gap: "10px" }}>
      <div style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        <h3>{user.name}</h3>
        <small>{user.email}</small>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        {messages.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", margin: "auto" }}>No hay mensajes aún</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              style={{
                display: "flex",
                justifyContent: msg.emisor._id === currentUser?._id ? "flex-end" : "flex-start",
                marginBottom: "8px"
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: msg.emisor._id === currentUser?._id ? "#007bff" : "#e9ecef",
                  color: msg.emisor._id === currentUser?._id ? "white" : "black",
                  wordWrap: "break-word"
                }}
              >
                {msg.content}
                <div style={{ fontSize: "0.8em", marginTop: "4px", opacity: 0.7 }}>
                  {new Date(msg.date).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #ddd", paddingTop: "10px" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
          rows={2}
          disabled={loading}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontFamily: "Arial"
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: "8px 16px",
            backgroundColor: input.trim() ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: input.trim() ? "pointer" : "not-allowed"
          }}
        >
          {loading ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
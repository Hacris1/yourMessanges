import { useState, useEffect } from "react";
import forge from "node-forge";

type User = {
  _id: string;
  name: string;
  email: string;
  publicKey?: string; // PEM del otro usuario
};

type ChatContainerProps = {
  user: User | null;
  myPrivateKey: forge.pki.rsa.PrivateKey | null;
  myPublicKey: forge.pki.rsa.PublicKey | null;
};

export default function ChatContainer({ user, myPrivateKey }: ChatContainerProps) {
  const [messages, setMessages] = useState<{ sender: "me" | "other"; text: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!user?.publicKey) return alert("Selecciona un usuario con clave pública");

    const recipientPublicKey = forge.pki.publicKeyFromPem(user.publicKey);

    // Cifrar con la llave pública del otro usuario
    const encrypted = recipientPublicKey.encrypt(input, "RSA-OAEP");
    const encoded = forge.util.encode64(encrypted);

    setMessages(prev => [...prev, { sender: "me", text: encoded }]);
    setInput("");


  };

  const receiveMessage = (cipherText: string) => {
    if (!myPrivateKey) return;

    try {
      const decoded = forge.util.decode64(cipherText);
      const decrypted = myPrivateKey.decrypt(decoded, "RSA-OAEP");

      setMessages(prev => [...prev, { sender: "other", text: decrypted }]);
    } catch (err) {
      console.error("Error descifrando:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ textAlign: m.sender === "me" ? "right" : "left" }}>
            <p>{m.text}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: "8px" }}
        />
        <button onClick={sendMessage} style={{ padding: "8px 16px" }}>
          Enviar
        </button>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import forge from "node-forge";
import EmojiPicker from "emoji-picker-react";
import fondowpp from "../../fondowpp.png";
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
  receptor?: string | { _id: string };
  date: string;
};

type ChatContainerProps = {
  user: User | null;
  myPrivateKey: forge.pki.rsa.PrivateKey | null;
  myPublicKey: forge.pki.rsa.PublicKey | null;
  token: string;
};

export default function ChatContainer({ user, myPrivateKey }: ChatContainerProps) {

  const { user: currentUser } = useAuth();

  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const { sendMessage: emitMessage, onMessageReceived } = useSocket(currentUser?._id || null);

  const getReceptorId = (message: Message) => {
    if (!message.receptor) return null;
    return typeof message.receptor === "string"
      ? message.receptor
      : message.receptor._id;
  };

  // RECIBIR MENSAJES SOCKET
  useEffect(() => {

    if (!onMessageReceived) return;

    const unsubscribe = onMessageReceived((message: Message) => {

      const receptorId = getReceptorId(message);

      const processedMessage: Message = { ...message };

      if (myPrivateKey && processedMessage.content && receptorId === currentUser?._id) {

        try {

          const decoded = forge.util.decode64(processedMessage.content);
          const decrypted = myPrivateKey.decrypt(decoded, "RSA-OAEP");
          processedMessage.content = decrypted;

        } catch (err) {

          console.error("Error descifrando mensaje:", err);

        }

      }

      const chatUserId = processedMessage.emisor._id === currentUser?._id
        ? receptorId
        : processedMessage.emisor._id;

      if (!chatUserId) return;

      setMessagesByChat(prev => ({
        ...prev,
        [chatUserId]: [...(prev[chatUserId] || []), processedMessage]
      }));

    });

    return unsubscribe;

  }, [myPrivateKey, onMessageReceived]);

  // ENVIAR MENSAJE
  const sendMessage = () => {

    if (!input.trim() || !user?.publicKey || !currentUser) return;

    setLoading(true);

    try {

      const recipientPublicKey = forge.pki.publicKeyFromPem(user.publicKey);
      const encrypted = recipientPublicKey.encrypt(input, "RSA-OAEP");
      const encoded = forge.util.encode64(encrypted);

      // SOCKET
      emitMessage({
        emisor: currentUser._id,
        receptor: user._id,
        content: input,
        encryptedContent: encoded
      });

      setMessagesByChat(prev => ({
        ...prev,
        [user._id]: [...(prev[user._id] || []), {
        _id: Date.now().toString(),
        content: input,
        emisor: {
          _id: currentUser._id,
          name: currentUser.name
        },
        receptor: user._id,
        date: new Date().toISOString()
      }]
      }));

      setInput("");

    } catch (err) {

      console.error("Error enviando mensaje:", err);

    } finally {

      setLoading(false);

    }

  };

  // ENTER
  const handleKeyPress = (e: React.KeyboardEvent) => {

    if (e.key === "Enter" && !e.shiftKey) {

      e.preventDefault();
      sendMessage();

    }

  };

  // EMOJIS
  const onEmojiClick = (emojiData: any) => {

    setInput(prev => prev + emojiData.emoji);

  };

  if (!user) {

    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "#999"
      }}>
        Selecciona un usuario para chatear
      </div>
    );

  }

  const messages = messagesByChat[user._id] || [];

  return (

    <div
      style={{
        backgroundImage: `url(${fondowpp})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        position: "relative"
      }}
    >

      {/* HEADER */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#202c33",
          borderBottom: "1px solid #1f2c34",
          fontWeight: 600,
          fontSize: "16px",
          color: "#e9edef"
        }}
      >
        {user.name}
      </div>

      {/* MENSAJES */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px"
        }}
      >

        {messages.length === 0 && (
          <p style={{ textAlign: "center", color: "#bbb" }}>
            No hay mensajes aún
          </p>
        )}

        {messages.map((msg) => (

          <div
            key={msg._id}
            style={{
              display: "flex",
              justifyContent:
                msg.emisor._id === currentUser?._id ? "flex-end" : "flex-start",
              marginBottom: "6px"
            }}
          >

            <div
              style={{
                backgroundColor:
                  msg.emisor._id === currentUser?._id
                    ? "#005c4b"
                    : "#202c33",
                color: "#e9edef",
                padding: "8px 12px",
                borderRadius: "12px",
                maxWidth: "60%",
                fontSize: "14px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.35)",

                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap"
              }}
            >

              {msg.content}

              <div
                style={{
                  fontSize: "11px",
                  opacity: 0.7,
                  marginTop: "4px",
                  textAlign: "right"
                }}
              >
                {new Date(msg.date).toLocaleTimeString()}
              </div>

            </div>

          </div>

        ))}

      </div>

      {/* INPUT WHATSAPP */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          backgroundColor: "#202c33",
          borderTop: "1px solid #1f2c34"
        }}
      >

        {/* EMOJI BUTTON */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            background: "none",
            border: "none",
            fontSize: "22px",
            cursor: "pointer",
            color: "#8696a0"
          }}
        >
          😊
        </button>

        {/* EMOJI PICKER */}
        {showEmojiPicker && (
          <div
            style={{
              position: "absolute",
              bottom: "70px",
              left: "10px",
              zIndex: 999
            }}
          >
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        {/* INPUT */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Escribe un mensaje..."
          disabled={loading}
          style={{
            flex: 1,
            border: "1px solid #2a3942",
            outline: "none",
            fontSize: "15px",
            color: "#e9edef",
            backgroundColor: "#111b21",
            borderRadius: "10px",
            padding: "10px 12px"
          }}
        />

        {/* SEND */}
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            backgroundColor: "#25d366",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>

      </div>

    </div>

  );
}
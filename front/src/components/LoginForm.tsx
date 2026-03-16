import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRSA } from "../hooks/useRSA";
import { useKeyDerivation } from "../hooks/useKeyDerivation";
import { jwtDecode } from "jwt-decode";
import { buildApiUrl } from "../utils/apiUrl";
import "../styles/LoginForm.css";

interface JwtPayload {
  id: string;
  name: string;
  email: string;
  publicKey?: string;
  iat?: number;
  exp?: number;
}

export function LoginForm() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const { setDerivedKeys } = useRSA();
  const { deriveKeysFromPassword } = useKeyDerivation();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let privateKeyPem = localStorage.getItem("persistedPrivateKeyPem");
      let publicKeyPem = localStorage.getItem("persistedPublicKeyPem");
      
      if (!privateKeyPem || !publicKeyPem) {
        const derived = await deriveKeysFromPassword(email, password);
        privateKeyPem = derived.privateKeyPem;
        publicKeyPem = derived.publicKeyPem;
      }
      
      sessionStorage.setItem("derivedPrivateKeyPem", privateKeyPem);
      sessionStorage.setItem("derivedPublicKeyPem", publicKeyPem);
      localStorage.setItem("persistedPrivateKeyPem", privateKeyPem);
      localStorage.setItem("persistedPublicKeyPem", publicKeyPem);

      setDerivedKeys(privateKeyPem, publicKeyPem);
      
      const res = await fetch(buildApiUrl("/api/user/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 401 && errorData.error?.includes("deactivated")) {
          setError("Tu cuenta ha sido desactivada. Contacta con soporte para reactivarla.");
        } else {
          setError("Usuario o contraseña incorrecta");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      const decoded = jwtDecode<JwtPayload>(data.token);
      const user = {
        _id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        publicKey: decoded.publicKey
      };
      
      // Sincronizar clave pública con servidor
      try {
        const updateRes = await fetch(buildApiUrl("/api/user/updatePublickey"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`
          },
          body: JSON.stringify({ 
            userId: user._id, 
            publicKey: publicKeyPem 
          })
        });
      } catch (err) {
        // Error silencioso en sincronización de clave pública
      }
      
      setAuth(data.token, user);
      navigate("/chat");
    } catch (err) {
      setError("Error de conexión con el servidor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !email || !password) {
      setError("Todos los campos son requeridos");
      setLoading(false);
      return;
    }

    try {
      if (!name || !email || !password) {
        setError("Todos los campos son requeridos");
        setLoading(false);
        return;
      }

      const { privateKeyPem, publicKeyPem } = await deriveKeysFromPassword(email, password);
      
      sessionStorage.setItem("derivedPrivateKeyPem", privateKeyPem);
      sessionStorage.setItem("derivedPublicKeyPem", publicKeyPem);
      
      localStorage.setItem("persistedPrivateKeyPem", privateKeyPem);
      localStorage.setItem("persistedPublicKeyPem", publicKeyPem);
      
      setDerivedKeys(privateKeyPem, publicKeyPem);
      
      const res = await fetch(buildApiUrl("/api/user/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password, publicKey: publicKeyPem })
      });

      if (!res.ok) {
        if (res.status === 409) {
          setError("El usuario ya existe");
        } else {
          setError("Error al registrar");
        }
        setLoading(false);
        return;
      }

      const loginRes = await fetch(buildApiUrl("/api/user/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const loginData = await loginRes.json();
      const decoded = jwtDecode<JwtPayload>(loginData.token);
      const user = {
        _id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        publicKey: decoded.publicKey
      };
      
      // Sincronizar clave pública con servidor
      try {
        const updateRes = await fetch(buildApiUrl("/api/user/updatePublickey"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginData.token}`
          },
          body: JSON.stringify({ 
            userId: user._id, 
            publicKey: publicKeyPem 
          })
        });
      } catch (err) {
        // Error silencioso en sincronización de clave pública
      }
      
      setAuth(loginData.token, user);
      navigate("/chat");
    } catch (err) {
      setError("Error de conexión");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>{isLogin ? "Iniciar Sesión" : "Registrarse"}</h1>

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          )}

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Cargando..." : (isLogin ? "Ingresar" : "Registrarse")}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        <div className="toggle-form">
          <p>
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setEmail("");
                setPassword("");
                setName("");
              }}
              disabled={loading}
            >
              {isLogin ? "Registrarse" : "Iniciar Sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
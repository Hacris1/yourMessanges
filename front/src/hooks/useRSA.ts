import { useState, useEffect } from "react";
import forge from "node-forge";
import { useAuth } from "../context/AuthContext";

export function useRSA() {
  const [publicKey, setPublicKey] = useState<forge.pki.rsa.PublicKey | null>(null);
  const [privateKey, setPrivateKey] = useState<forge.pki.rsa.PrivateKey | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let privateKeyPem = sessionStorage.getItem("derivedPrivateKeyPem");
    let publicKeyPem = sessionStorage.getItem("derivedPublicKeyPem");

    if (!privateKeyPem || !publicKeyPem) {
      privateKeyPem = localStorage.getItem("persistedPrivateKeyPem");
      publicKeyPem = localStorage.getItem("persistedPublicKeyPem");
      
      if (privateKeyPem && publicKeyPem) {
        // Copiar a sessionStorage también
        sessionStorage.setItem("derivedPrivateKeyPem", privateKeyPem);
        sessionStorage.setItem("derivedPublicKeyPem", publicKeyPem);
      }
    }

    if (privateKeyPem && publicKeyPem && user) {
      try {
        const privKey = forge.pki.privateKeyFromPem(privateKeyPem);
        const pubKey = forge.pki.publicKeyFromPem(publicKeyPem);
        
        setPrivateKey(privKey);
        setPublicKey(pubKey);
      } catch (err) {
        console.error("❌ Error parseando claves:", err);
      }
    }
  }, [user]);

  // Establecer claves derivadas (llamado desde LoginForm después de derivar)
  const setDerivedKeys = (privateKeyPem: string, publicKeyPem: string) => {
    try {
      const privKey = forge.pki.privateKeyFromPem(privateKeyPem);
      const pubKey = forge.pki.publicKeyFromPem(publicKeyPem);
      
      // Almacenar en sessionStorage (temporal, se borra al cerrar navegador)
      sessionStorage.setItem("derivedPrivateKeyPem", privateKeyPem);
      sessionStorage.setItem("derivedPublicKeyPem", publicKeyPem);
      
      // TAMBIÉN guardar en localStorage para persistencia
      localStorage.setItem("persistedPrivateKeyPem", privateKeyPem);
      localStorage.setItem("persistedPublicKeyPem", publicKeyPem);
      
      setPrivateKey(privKey);
      setPublicKey(pubKey);
      
      return { privateKey: privKey, publicKey: pubKey };
    } catch (err) {
      console.error("❌ Error estableciendo claves derivadas:", err);
      return { privateKey: null, publicKey: null };
    }
  };

  const encryptMessage = (message: string) => {
    if (!publicKey) throw new Error("No hay clave pública");

    const encrypted = publicKey.encrypt(message, "RSA-OAEP");
    return forge.util.encode64(encrypted);
  };

  const decryptMessage = (cipherText: string) => {
    if (!privateKey) throw new Error("No hay clave privada");

    const decoded = forge.util.decode64(cipherText);
    return privateKey.decrypt(decoded, "RSA-OAEP");
  };

  // Desencriptar intentando con clave actual y claves antiguas del historial
  const decryptMessageWithHistory = (cipherText: string): string | null => {
    try {
      // Primero intenta con la clave actual
      if (privateKey) {
        try {
          const decoded = forge.util.decode64(cipherText);
          const decrypted = privateKey.decrypt(decoded, "RSA-OAEP");
          return decrypted;
        } catch (err) {
          // Continuar con claves antiguas
        }
      }

      // Si falla la actual, intenta con claves antiguas del historial
      const oldPrivateKeysJson = localStorage.getItem("oldPrivateKeys");
      if (oldPrivateKeysJson) {
        const oldPrivateKeysPems: string[] = JSON.parse(oldPrivateKeysJson);
        
        for (let i = 0; i < oldPrivateKeysPems.length; i++) {
          try {
            const oldKey = forge.pki.privateKeyFromPem(oldPrivateKeysPems[i]);
            const decoded = forge.util.decode64(cipherText);
            const decrypted = oldKey.decrypt(decoded, "RSA-OAEP");
            return decrypted;
          } catch (err) {
            continue;
          }
        }
      }

      return null;
    } catch (err) {
      console.error("❌ Error en desencriptación con historial:", err);
      return null;
    }
  };

  // Generar nuevas claves RSA
  const generateNewKeys = () => {
    try {
      const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
      
      const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
      const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
      
      // Guardar en ambos storages
      sessionStorage.setItem("privateKeyPem", privateKeyPem);
      sessionStorage.setItem("publicKeyPem", publicKeyPem);
      localStorage.setItem("privateKeyPem", privateKeyPem);
      localStorage.setItem("publicKeyPem", publicKeyPem);
      
      // También guardar con prefijos
      sessionStorage.setItem("derivedPrivateKeyPem", privateKeyPem);
      sessionStorage.setItem("derivedPublicKeyPem", publicKeyPem);
      localStorage.setItem("persistedPrivateKeyPem", privateKeyPem);
      localStorage.setItem("persistedPublicKeyPem", publicKeyPem);
      
      setPrivateKey(keypair.privateKey);
      setPublicKey(keypair.publicKey);
      
      return { 
        privateKeyPem, 
        publicKeyPem,
        privateKey: keypair.privateKey,
        publicKey: keypair.publicKey
      };
    } catch (err) {
      console.error("❌ Error generando claves RSA:", err);
      return { privateKeyPem: "", publicKeyPem: "", privateKey: null, publicKey: null };
    }
  };

  // Cargar claves del storage
  const loadKeysFromStorage = () => {
    try {
      // Intenta cargar de sessionStorage primero
      let privateKeyPem = sessionStorage.getItem("privateKeyPem") || 
                         sessionStorage.getItem("derivedPrivateKeyPem");
      let publicKeyPem = sessionStorage.getItem("publicKeyPem") || 
                        sessionStorage.getItem("derivedPublicKeyPem");
      
      // Si no, intenta localStorage
      if (!privateKeyPem || !publicKeyPem) {
        privateKeyPem = localStorage.getItem("privateKeyPem") || 
                       localStorage.getItem("persistedPrivateKeyPem");
        publicKeyPem = localStorage.getItem("publicKeyPem") || 
                      localStorage.getItem("persistedPublicKeyPem");
      }
      
      if (privateKeyPem && publicKeyPem) {
        const privKey = forge.pki.privateKeyFromPem(privateKeyPem);
        const pubKey = forge.pki.publicKeyFromPem(publicKeyPem);
        
        setPrivateKey(privKey);
        setPublicKey(pubKey);
        
        // Asegurar que están en ambos storages con ambos nombres
        sessionStorage.setItem("privateKeyPem", privateKeyPem);
        sessionStorage.setItem("publicKeyPem", publicKeyPem);
        sessionStorage.setItem("derivedPrivateKeyPem", privateKeyPem);
        sessionStorage.setItem("derivedPublicKeyPem", publicKeyPem);
        localStorage.setItem("privateKeyPem", privateKeyPem);
        localStorage.setItem("publicKeyPem", publicKeyPem);
        localStorage.setItem("persistedPrivateKeyPem", privateKeyPem);
        localStorage.setItem("persistedPublicKeyPem", publicKeyPem);
        
        return { privateKey: privKey, publicKey: pubKey };
      } else {
        console.error("❌ No se encontraron claves en el storage");
        return { privateKey: null, publicKey: null };
      }
    } catch (err) {
      console.error("❌ Error cargando claves del storage:", err);
      return { privateKey: null, publicKey: null };
    }
  };

  return { 
    publicKey, 
    privateKey, 
    encryptMessage, 
    decryptMessage,
    decryptMessageWithHistory,
    setDerivedKeys,
    generateNewKeys,
    loadKeysFromStorage
  };
}

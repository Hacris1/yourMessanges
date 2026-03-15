import { useState, useEffect } from "react";
import forge from "node-forge";

export function useRSA() {
  const [publicKey, setPublicKey] = useState<forge.pki.rsa.PublicKey | null>(null);
  const [privateKey, setPrivateKey] = useState<forge.pki.rsa.PrivateKey | null>(null);


  useEffect(() => {
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });

    setPublicKey(keypair.publicKey);
    setPrivateKey(keypair.privateKey);
  }, []);

  const encryptMessage = (message: string) => {
    if (!publicKey) throw new Error("No hay clave publica");

    const encrypted = publicKey.encrypt(message, "RSA-OAEP");
    return forge.util.encode64(encrypted);
  };

  const decryptMessage = (cipherText: string) => {
    if (!privateKey) throw new Error("No hay clave privada");

    const decoded = forge.util.decode64(cipherText);
    return privateKey.decrypt(decoded, "RSA-OAEP");
  };

  return { publicKey, privateKey, encryptMessage, decryptMessage };
}

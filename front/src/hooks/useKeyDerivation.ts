import forge from "node-forge";
import seedrandom from "seedrandom";

/**
 * Hook para derivar claves RSA determinísticamente de una contraseña
 * Usa PBKDF2 para derivar una semilla, luego genera claves RSA de forma determinística
 */
export function useKeyDerivation() {
  /**
   * Genera una semilla determinística usando PBKDF2
   * @param email - Email del usuario (usado como salt)
   * @param password - Contraseña del usuario
   * @returns Semilla como string para usar con seedrandom
   */
  async function deriveSeedFromPassword(
    email: string,
    password: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(email); // Email como salt

    // PBKDF2 con 100,000 iteraciones (estándar actual)
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: 100000,
        hash: "SHA-256",
      },
      await window.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        "PBKDF2",
        false,
        ["deriveBits"]
      ),
      256 // 256 bits para usar como semilla
    );

    // Convertir a hex string para usar con seedrandom
    const seedArray = new Uint8Array(derivedBits);
    const seedHex = Array.from(seedArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return seedHex;
  }

  /**
   * Genera claves RSA determinísticamente desde una semilla
   * Usa seedrandom para crear un PRNG determinístico
   */
  function generateDeterministicKeys(seed: string): {
    privateKeyPem: string;
    publicKeyPem: string;
  } {
    // Crear un PRNG determinístico basado en la semilla
    const rng = seedrandom(seed);

    // Crear un PRNG compatible con forge que devuelve string
    const forgeRng = {
      getBytesSync: (numBytes: number) => {
        let randomBytes = "";
        for (let i = 0; i < numBytes; i++) {
          randomBytes += String.fromCharCode(Math.floor(rng() * 256));
        }
        return randomBytes;
      }
    };

    // Generar claves RSA usando el RNG personalizado
    const keypair = forge.pki.rsa.generateKeyPair({
      bits: 2048,
      e: 0x10001,
      prng: forgeRng
    } as any);

    const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
    const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);

    return { privateKeyPem, publicKeyPem };
  }

  /**
   * Flujo completo: contraseña → semilla → claves
   */
  async function deriveKeysFromPassword(
    email: string,
    password: string
  ): Promise<{ privateKeyPem: string; publicKeyPem: string }> {
    const seed = await deriveSeedFromPassword(email, password);
    const keys = generateDeterministicKeys(seed);
    return keys;
  }

  return {
    deriveKeysFromPassword,
    deriveSeedFromPassword,
    generateDeterministicKeys,
  };
}

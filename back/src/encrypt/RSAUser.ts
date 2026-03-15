import NodeRSA from 'node-rsa';

export class RSAUserService {
    /**
     * Genera un par de claves RSA (pública y privada) para un usuario
     * @returns {Object} Objeto con las claves pública y privada en formato PEM
     */
    public generateKeyPair(): { publicKey: string; privateKey: string } {
        const key = new NodeRSA({ b: 2048 });
        
        const publicKey = key.exportKey('public');
        const privateKey = key.exportKey('private');

        return {
            publicKey: publicKey.toString(),
            privateKey: privateKey.toString()
        };
    }

    /**
     * Encripta un mensaje con la clave pública de un usuario
     * @param message Mensaje a encriptar
     * @param publicKey Clave pública del usuario destino
     * @returns Mensaje encriptado en base64
     */
    public encryptMessage(message: string, publicKey: string): string {
        const key = new NodeRSA(publicKey);
        return key.encrypt(message, 'base64');
    }

    /**
     * Desencripta un mensaje con la clave privada de un usuario
     * @param encryptedMessage Mensaje encriptado en base64
     * @param privateKey Clave privada del usuario
     * @returns Mensaje desencriptado
     */
    public decryptMessage(encryptedMessage: string, privateKey: string): string {
        const key = new NodeRSA(privateKey);
        return key.decrypt(encryptedMessage, 'utf8');
    }
}

export const rsaUserService = new RSAUserService();

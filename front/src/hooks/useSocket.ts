import { useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = (userId: string | null) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const API_URL = import.meta.env.VITE_API_URL;
    socketRef.current = io(API_URL?.replace('/api', '') || 'http://192.168.1.21:4000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('Conectado a WebSocket:', socketRef.current?.id);
      socketRef.current?.emit('register-user', userId);
    });

    socketRef.current.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Desconectado de WebSocket');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  const sendMessage = useCallback((data: {
    emisor: string;
    receptor: string;
    content: string;
    encryptedContent: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send-message', data);
    }
  }, []);

  const onMessageReceived = useCallback((callback: (message: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('receive-message', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive-message', callback);
      }
    };
  }, []);

  const onMessageSent = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('message-sent', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('message-sent', callback);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    sendMessage,
    onMessageReceived,
    onMessageSent,
    isConnected: socketRef.current?.connected || false
  };
};

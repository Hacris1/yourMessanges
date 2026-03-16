import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { messageServices } from '../message/message.service.js';
import { userServices } from '../user/user.service.js';

const connectedUsers: Map<string, string> = new Map();

export function initializeSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {

    socket.on('register-user', (userId: string) => {
      connectedUsers.set(userId, socket.id);
      socket.join(`user:${userId}`); 
    });

    socket.on('send-message', async (data: {
      emisor: string;
      receptor: string;
      content: string;
      encryptedContent: string;
    }) => {
      try {
        const emisorUser = await userServices.getById(data.emisor);
        const receptorUser = await userServices.getById(data.receptor);

        if (!emisorUser || !receptorUser) {
          socket.emit('message-error', { error: 'Usuario no encontrado' });
          return;
        }

        const message = await messageServices.create({
          content: data.encryptedContent,
          emisor: emisorUser,
          receptor: receptorUser,
          date: new Date()
        });

        const receptorSocketId = connectedUsers.get(data.receptor);
        if (receptorSocketId) {
          io.to(`user:${data.receptor}`).emit('receive-message', {
            _id: message._id,
            content: message.content,
            emisor: {
              _id: emisorUser._id,
              name: emisorUser.name
            },
            receptor: data.receptor,
            date: message.date
          });
        }

        socket.emit('message-sent', {
          _id: message._id,
          status: 'sent',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('message-error', { error: 'Error al enviar mensaje' });
      }
    });

    socket.on('disconnect', () => {
      connectedUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
        }
      });
    });
  });

  return io;
}

export function getConnectedUsers() {
  return connectedUsers;
}

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(fallbackUrl?: string): Socket {
  if (!socket) {
    let url = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!url || url === 'undefined') {
      url = fallbackUrl || 'http://localhost:3001';
    }
    socket = io(`${url}/results`, {
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}

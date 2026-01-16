const SOCKET_URL = 'https://little-watch-backend.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId, onVitalAlert) {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.socket.emit('join_user_room', userId);
    });

    this.socket.on('vital_alert', (data) => {
      console.log('🚨 Alert received:', data);
      if (onVitalAlert) {
        onVitalAlert(data); // Pass data to the callback
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketService();
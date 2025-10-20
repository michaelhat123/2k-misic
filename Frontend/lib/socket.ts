import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket && this.isConnected && this.userId === userId) {

      return;
    }

    // Disconnect existing socket if different user
    if (this.socket && this.userId !== userId) {
      this.disconnect();
    }

    this.userId = userId;
    

    
    this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'https://twok-music-qz52.onrender.com', {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
  
      this.isConnected = true;
      
      // Authenticate with backend
      this.socket?.emit('authenticate', { uid: userId });
    });

    this.socket.on('authenticated', (data) => {
  
    });

    this.socket.on('disconnect', () => {
  
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      // Silent fail
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
    }
  }

  // 🚀 LISTEN FOR REAL-TIME PROFILE PICTURE UPDATES
  onProfilePictureUpdate(callback: (data: { uid: string; profile_picture: string | null; timestamp: string }) => void) {
    if (!this.socket) {
      return;
    }

    this.socket.on('profile_picture_updated', (data) => {
      callback(data);
    });
  }

  // 🚀 LISTEN FOR REAL-TIME PROFILE UPDATES
  onProfileUpdate(callback: (data: { id: string; profile: any; timestamp: string }) => void) {
    if (!this.socket) {
      return;
    }

    this.socket.on('profile_updated', (data) => {
      callback(data);
    });
  }

  // Remove listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners('profile_picture_updated');
      this.socket.removeAllListeners('profile_updated');
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

// Export singleton instance
export const socketService = new SocketService();

import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
  };
  receiver: {
    _id: string;
    username: string;
  };
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface MessageListener {
  (message: Message): void;
}

interface VideoCallData {
  senderId: string;
  senderName: string;
  receiverId: string;
  meetingId: string;
}

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private typingListeners: Set<(data: { userId: string; isTyping: boolean }) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pendingMessages: Array<{ receiverId: string; content: string }> = [];
  private videoCallListeners: ((data: VideoCallData) => void)[] = [];
  private videoCallResponseListeners: ((accepted: boolean, meetingId?: string) => void)[] = [];

  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('[Socket] Attempting to connect with userId:', userId);
        
        if (this.socket?.connected) {
          console.log('[Socket] Already connected, disconnecting first...');
          this.disconnect();
        }
        
        // Store userId first
        this.userId = userId;

        // Create socket connection
        this.socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          query: { userId },
          forceNew: true
        });

        this.socket.on('connect', () => {
          console.log('[Socket] Connected successfully with socket ID:', this.socket?.id);
          this.socket?.emit('join', userId);
          console.log('[Socket] Sent join event with userId:', userId);
          
          // Send any pending messages
          if (this.pendingMessages.length > 0) {
            console.log('[Socket] Sending pending messages:', this.pendingMessages.length);
            this.sendPendingMessages();
          }
          
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('[Socket] Connection error:', error);
          reject(error);
        });

        this.socket.on('message', (message: Message) => {
          console.log('[Socket] Received message:', {
            messageId: message._id,
            content: message.content,
            senderId: message.sender._id,
            receiverId: message.receiver._id,
            currentUserId: this.userId,
            status: message.status,
            timestamp: message.timestamp
          });

          // Verify message is intended for this user
          if (message.receiver._id === this.userId || message.sender._id === this.userId) {
            console.log('[Socket] Message is relevant for current user, notifying listeners');
            this.messageListeners.forEach(listener => {
              listener(message);
            });
          } else {
            console.log('[Socket] Message not intended for current user, ignoring');
          }
        });

        this.socket.on('messageError', (error: any) => {
          console.error('[Socket] Message error:', error);
        });

        this.socket.on('userTyping', (data: { userId: string; isTyping: boolean }) => {
          console.log('[Socket] Typing status received:', data);
          this.typingListeners.forEach(listener => listener(data));
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            console.log('[Socket] Server initiated disconnect, attempting to reconnect...');
            this.socket?.connect();
          }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
          if (this.userId) {
            console.log('[Socket] Re-joining with userId:', this.userId);
            this.socket?.emit('join', this.userId);
          }
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('[Socket] Reconnection error:', error);
        });

        this.socket?.on('video-call-request', (data: VideoCallData) => {
          console.log('Received video call request:', data);
          this.videoCallListeners.forEach(listener => listener(data));
        });

        this.socket?.on('video-call-response', ({ accepted, meetingId }: { accepted: boolean; meetingId?: string }) => {
          console.log('Received video call response:', { accepted, meetingId });
          this.videoCallResponseListeners.forEach(listener => listener(accepted, meetingId));
        });

      } catch (error) {
        console.error('[Socket] Error in connection:', error);
        reject(error);
      }
    });
  }

  private sendPendingMessages() {
    console.log('[Socket] Processing pending messages...');
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        console.log('[Socket] Sending pending message:', message);
        this.sendMessage(message.receiverId, message.content);
      }
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[Socket] Initiating disconnect');
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.messageListeners.clear();
      this.typingListeners.clear();
      this.pendingMessages = [];
      this.videoCallListeners = [];
      this.videoCallResponseListeners = [];
      console.log('[Socket] Disconnected and cleaned up');
    }
  }

  sendMessage(receiverId: string, content: string): void {
    if (!this.socket?.connected) {
      console.log('[Socket] Not connected, queueing message:', { receiverId, content });
      this.pendingMessages.push({ receiverId, content });
      return;
    }

    if (!this.userId) {
      console.error('[Socket] Cannot send message: No userId set');
      return;
    }

    const messageData = {
      senderId: this.userId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    console.log('[Socket] Sending message:', messageData);
    
    this.socket.emit('message', messageData, (acknowledgement: any) => {
      if (acknowledgement?.error) {
        console.error('[Socket] Message send error:', acknowledgement.error);
      } else {
        console.log('[Socket] Message sent successfully:', acknowledgement);
      }
    });
  }

  sendTyping(receiverId: string, isTyping: boolean): void {
    if (!this.socket?.connected) {
      console.error('[Socket] Cannot send typing status: Socket not connected');
      return;
    }

    console.log('[Socket] Sending typing status:', { roomId: receiverId, isTyping });
    this.socket.emit('typing', { roomId: receiverId, isTyping });
  }

  onMessageReceived(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    console.log('[Socket] Added message listener, total listeners:', this.messageListeners.size);
    
    return () => {
      this.messageListeners.delete(listener);
      console.log('[Socket] Removed message listener, remaining listeners:', this.messageListeners.size);
    };
  }

  onTypingStatusReceived(listener: (data: { userId: string; isTyping: boolean }) => void): () => void {
    this.typingListeners.add(listener);
    return () => {
      this.typingListeners.delete(listener);
    };
  }

  public addVideoCallListener(listener: (data: VideoCallData) => void): () => void {
    this.videoCallListeners.push(listener);
    return () => {
      this.videoCallListeners = this.videoCallListeners.filter(l => l !== listener);
    };
  }

  public addVideoCallResponseListener(listener: (accepted: boolean, meetingId?: string) => void): () => void {
    this.videoCallResponseListeners.push(listener);
    return () => {
      this.videoCallResponseListeners = this.videoCallResponseListeners.filter(l => l !== listener);
    };
  }

  public initiateVideoCall(data: VideoCallData): void {
    if (this.socket) {
      console.log('Initiating video call:', data);
      this.socket.emit('video-call-request', data);
    } else {
      console.warn('Socket not connected. Cannot initiate video call.');
    }
  }

  public respondToVideoCall(senderId: string, accepted: boolean, meetingId?: string): void {
    if (this.socket) {
      console.log('Responding to video call:', { senderId, accepted, meetingId });
      this.socket.emit('video-call-response', { senderId, accepted, meetingId });
    } else {
      console.warn('Socket not connected. Cannot respond to video call.');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  onMessageDelivered(callback: (messageId: string) => void) {
    this.socket?.on('message_delivered', callback);
    return () => {
      this.socket?.off('message_delivered', callback);
    };
  }

  onMessageRead(callback: (messageId: string) => void) {
    this.socket?.on('message_read', callback);
    return () => {
      this.socket?.off('message_read', callback);
    };
  }

  sendMessageRead(messageId: string) {
    if (this.socket?.connected) {
      this.socket.emit('message_read', messageId);
    }
  }
}

export default new SocketService(); 
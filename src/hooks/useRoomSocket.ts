import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { RoomData, UserProfile } from '../types';
import { sendAlert } from '../services/notificationService';

interface UseRoomSocketOptions {
  user: UserProfile | null;
  roomId: string;
  // Called when the server removes the user or deletes the room; App handles logout UI.
  onRemoved: (message: string) => void;
}

interface UseRoomSocket {
  roomData: RoomData | null;
  isConnected: boolean;
  isPendingApproval: boolean;
  sendSocketEvent: (type: string, data?: any) => void;
  disconnect: () => void;
}

// Owns the room WebSocket lifecycle: connect, auto-reconnect, room:sync state, and outbound events.
export function useRoomSocket({ user, roomId, onRemoved }: UseRoomSocketOptions): UseRoomSocket {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const onRemovedRef = useRef(onRemoved);
  onRemovedRef.current = onRemoved;

  const connectWebSocket = useCallback(() => {
    if (!user) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'room:join',
          roomId,
          user,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'room:sync') {
          setRoomData(message.data);
          setIsPendingApproval(false);
        } else if (message.type === 'room:pending_approval') {
          setIsPendingApproval(true);
        } else if (message.type === 'room:removed' || message.type === 'room:deleted') {
          setRoomData(null);
          onRemovedRef.current(message.message);
          ws.close();
        } else if (message.type === 'notification:toast') {
          const toast = message.data || {};
          sendAlert({
            title: toast.title || 'Room Queue Alert',
            body: toast.message || '',
            type: toast.type === 'warning' ? 'warning' : 'queue',
          });
        } else if (message.type === 'chat:new') {
          setRoomData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              chat: [...prev.chat.slice(-50), message.data],
            };
          });

          if (message.data.type === 'reaction') {
            confetti({
              particleCount: 20,
              spread: 50,
              origin: { y: 0.7 },
            });
          }
        }
      } catch (err) {
        console.error('WebSocket receive error:', err);
      }
    };

    ws.onclose = () => {
      if (socketRef.current !== ws) return;
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 2500);
    };

    ws.onerror = (err) => {
      console.warn('WebSocket connection error:', err);
    };
  }, [user, roomId]);

  useEffect(() => {
    if (user) {
      connectWebSocket();
    }
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [user, roomId, connectWebSocket]);

  const sendSocketEvent = useCallback(
    (type: string, data?: any) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && user) {
        socketRef.current.send(
          JSON.stringify({
            type,
            roomId,
            user,
            data,
          })
        );
      }
    },
    [user, roomId]
  );

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    socketRef.current?.close();
    socketRef.current = null;
    setRoomData(null);
    setIsConnected(false);
    setIsPendingApproval(false);
  }, []);

  return {
    roomData,
    isConnected,
    isPendingApproval,
    sendSocketEvent,
    disconnect,
  };
}

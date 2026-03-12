import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';

export const useWebSocket = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector((state) => state.auth.accessToken);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    // Only connect if the user is authenticated and we have a token
    if (!isAuthenticated || !token) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const wsUrl = `${VITE_API_URL}/ws`;

    const client = new Client({
      // We use SockJS factory because browsers might not pass native headers properly
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // console.log('[STOMP]: ', str); // Un-comment for debugging
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.onWebSocketClose = () => {
      setIsConnected(false);
    };

    client.activate();
    clientRef.current = client;

    // Cleanup on unmount or when token changes
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        setIsConnected(false);
      }
    };
  }, [token, isAuthenticated]);

  /**
   * Subscribe to a topic/queue
   * @param {string} destination - The topic or queue to subscribe to
   * @param {function} callback - Function to handle the parsed message body
   * @returns {object|null} - The subscription object (for unsubscribing), or null if not connected
   */
  const subscribe = useCallback((destination, callback) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn(`Cannot subscribe to ${destination} - STOMP client not connected`);
      return null;
    }

    return clientRef.current.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (e) {
        callback(message.body); // Fallback for plain text
      }
    });
  }, [isConnected]);

  return { isConnected, subscribe };
};

export default useWebSocket;

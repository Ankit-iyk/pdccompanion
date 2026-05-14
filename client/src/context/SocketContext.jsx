import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function SocketProvider({ children }) {
  const { token }       = useAuth();
  const socketRef       = useRef(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      // Allow polling fallback — critical for production environments behind proxies
      transports: ['websocket', 'polling'],
      // Reconnection config — survives backend restarts during demo
      reconnection:        true,
      reconnectionAttempts: 10,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setReconnecting(false);
      socket.emit('join_monitoring');
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      // 'io server disconnect' means intentional — don't mark as reconnecting
      if (reason !== 'io server disconnect') setReconnecting(true);
    });

    socket.on('reconnect_attempt', () => setReconnecting(true));
    socket.on('reconnect',        () => setReconnecting(false));
    socket.on('reconnect_failed', () => setReconnecting(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinPatient  = (id) => socketRef.current?.emit('join_patient', id);
  const leavePatient = (id) => socketRef.current?.emit('leave_patient', id);

  // Stable event binding — listeners should be added on the socket ref directly
  const on  = (event, cb) => socketRef.current?.on(event, cb);
  const off = (event, cb) => socketRef.current?.off(event, cb);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, reconnecting, joinPatient, leavePatient, on, off }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

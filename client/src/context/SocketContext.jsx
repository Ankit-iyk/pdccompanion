import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect',    () => { setConnected(true);  socket.emit('join_monitoring'); });
    socket.on('disconnect', () => setConnected(false));

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token]);

  const joinPatient  = (id) => socketRef.current?.emit('join_patient', id);
  const leavePatient = (id) => socketRef.current?.emit('leave_patient', id);
  const on  = (event, cb) => { socketRef.current?.on(event, cb);  };
  const off = (event, cb) => { socketRef.current?.off(event, cb); };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinPatient, leavePatient, on, off }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

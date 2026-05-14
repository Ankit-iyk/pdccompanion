// Socket.IO room & event management
export function initSocketHandler(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join patient-specific room for targeted telemetry
    socket.on('join_patient', (patientId) => {
      socket.join(`patient:${patientId}`);
      console.log(`[Socket] ${socket.id} joined patient:${patientId}`);
    });

    // Join global monitoring room (receives all patient telemetry)
    socket.on('join_monitoring', () => {
      socket.join('monitoring');
      console.log(`[Socket] ${socket.id} joined monitoring room`);
    });

    socket.on('leave_patient', (patientId) => {
      socket.leave(`patient:${patientId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

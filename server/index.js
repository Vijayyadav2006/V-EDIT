const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);
const userSocketMap = {};

// Get all connected clients in a room
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    })
  );
};

io.on("connection", (socket) => {
  socket.on("join", ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);


    console.log(`${username} has joined room ${roomId}`);
    const clients = getAllConnectedClients(roomId);

    console.log(`[${getCurrentTimestamp()}] User '${username}' joined room '${roomId}'`);

    // Notify all users that a new user has joined
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on("code-change", ({ roomId, code, senderSocketId }) => {
    socket.to(roomId).emit("code-change", { code, senderSocketId });
  });

  socket.on("sync-code", ({ socketId, code }) => {
    io.to(socketId).emit("sync-code", { code });
  });

  // Improved Typing Indicator with Throttling
  socket.on("typing", ({ roomId, username }) => {
    socket.to(roomId).emit("userTyping", { username });

    setTimeout(() => {
      socket.to(roomId).emit("userTyping", { username: "" });
    }, 1500);
  });

  socket.on("disconnect", () => {
    const username = userSocketMap[socket.id];
    const roomId = userRoomMap[socket.id]; // ✅ Get the stored room ID

    if (roomId) {
      console.log(`[${getCurrentTimestamp()}] User '${username}' left room '${roomId}'`);

      socket.to(roomId).emit("left", {
        socketId: socket.id,
        username,
      });
    }

    // Cleanup
    delete userSocketMap[socket.id];
    delete userRoomMap[socket.id]; // ✅ Remove room tracking
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

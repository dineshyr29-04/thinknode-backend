const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: "*", // Allow all origins for the dual React apps
                methods: ["GET", "POST", "PATCH", "DELETE"]
            }
        });

        io.on("connection", (socket) => {
            logger.info(`Client connected: ${socket.id}`);

            // Listen for customer registration events
            socket.on("register:customer", (data) => {
                logger.info(`Customer registration attempt: ${data?.email}`);
                socket.broadcast.emit("notification:newCustomer", {
                    message: `New customer registered: ${data?.full_name || data?.username}`,
                    timestamp: new Date(),
                    customerId: data?.id
                });
            });

            // Listen for customer login events
            socket.on("login:customer", (data) => {
                logger.info(`Customer login: ${data?.username}`);
                socket.broadcast.emit("notification:customerLogin", {
                    message: `Customer logged in: ${data?.username}`,
                    timestamp: new Date(),
                    customerId: data?.id
                });
            });

            // Join a room for notifications
            socket.on("joinRoom", (room) => {
                socket.join(room);
                logger.info(`Socket ${socket.id} joined room: ${room}`);
            });

            // Leave a room
            socket.on("leaveRoom", (room) => {
                socket.leave(room);
                logger.info(`Socket ${socket.id} left room: ${room}`);
            });

            // Send notification to specific customer
            socket.on("sendNotification", (data) => {
                io.to(data.userId).emit("notification:received", {
                    message: data.message,
                    type: data.type,
                    timestamp: new Date()
                });
            });

            socket.on("disconnect", () => {
                logger.info(`Client disconnected: ${socket.id}`);
            });
        });

        return io;
    },

    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};

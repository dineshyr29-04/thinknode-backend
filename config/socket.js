const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin:     "*", // Allow all origins for the dual React apps
                methods: ["GET", "POST", "PATCH", "DELETE"]
            }
        });

        io.on("connection", (socket) => {
            logger.info(`Client connected: ${socket.id}`);

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

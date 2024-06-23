import Message from "../models/Message.js";
import { chatSocketFunctions } from "../controllers/ChatController.js";

export default (io) => {
    io.on("connection", (socket) => {
        
        chatSocketFunctions(io, socket);

        socket.on("disconnect", () => {
            console.log("socket disconnected")
        });
    });
}
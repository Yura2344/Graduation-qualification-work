import { Server } from "socket.io";

import {server} from "./server.js";
import sessionMiddleware from "./sessionMiddleware.js";

const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    },
    maxHttpBufferSize: 1024 * 1024 * 1024 * 2
});
io.engine.use(sessionMiddleware);

export default io;
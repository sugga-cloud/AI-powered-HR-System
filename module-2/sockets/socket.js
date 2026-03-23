import { Server } from 'socket.io';
import { runAgent } from '../agent/agentLoop.js';

const sessionBuffers = new Map();

export const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    io.on("connection", async (socket) => {
        console.log(`📡 Human Listener Active: ${socket.id}`);
        
        // Initialize session state
        sessionBuffers.set(socket.id, { text: "", timer: null });

        // --- 🔥 1. THE WELCOME & ANALYSIS TRIGGER ---
        // This runs the moment the user opens the page/connects
        try {
            socket.emit("status", { message: "Aurion is analyzing pending tasks..." });
            
            const welcomeReply = await runAgent({ 
                userInput: "INIT_WELCOME_FLOW", // Special flag for your agent to start cheering/analyzing
                sessionId: socket.id, 
                employeeId: "EMP001",
                flowType: "WELCOME_AND_ANALYSIS" 
            });

            socket.emit("agent-response", { reply: welcomeReply });
        } catch (error) {
            console.error("Welcome Error:", error);
        }

        // --- 2. THE CONTINUOUS STREAMING LOGIC ---
        socket.on("stream-text", async (data) => {
            const { text, sessionId, isFinal, employeeId } = data;
            let session = sessionBuffers.get(socket.id);
            if (!session) return;

            // Accumulate text from the stream
            session.text += " " + text;

            // Reset the silence timer
            if (session.timer) clearTimeout(session.timer);

            const triggerProcess = async () => {
                const command = session.text.trim();
                session.text = ""; // Clear buffer immediately to prevent double-processing

                if (command.length > 2) {
                    socket.emit("status", { message: "Processing..." });
                    try {
                        const reply = await runAgent({ 
                            userInput: command, 
                            sessionId: sessionId || socket.id, 
                            employeeId: employeeId || "EMP001",
                            flowType: "EXECUTION"
                        });
                        socket.emit("agent-response", { reply });
                    } catch (err) {
                        socket.emit("agent-response", { reply: "Sorry, I hit a snag." });
                    }
                }
            };

            if (isFinal) {
                await triggerProcess();
            } else {
                // Wait for 1.2 seconds of silence before assuming the user is done
                session.timer = setTimeout(triggerProcess, 1200);
            }
        });

        socket.on("disconnect", () => {
            const session = sessionBuffers.get(socket.id);
            if (session?.timer) clearTimeout(session.timer);
            sessionBuffers.delete(socket.id);
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    return io;
};
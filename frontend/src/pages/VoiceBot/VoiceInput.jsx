import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { speak, initVoice } from "../../utils/speechService";

const VoiceInput = ({ socketUrl = "http://localhost:3000" }) => {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");

  const socket = useRef(null);
  const recognitionRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    // 1. Initialize Socket
    socket.current = io(socketUrl);

    socket.current.on("connect", () => {
      console.log("Connected to Aurion Server");
      // The Welcome/Analysis will trigger on the backend automatically upon this connection
    });

    socket.current.on("status", (data) => {
      setStatus(data.message || data.state);
    });

    socket.current.on("agent-response", (data) => {
      setLoading(false);
      setResponse(data.reply);
      speak(data.reply);
      setStatus("Waiting for next command...");
    });

    initializeRecognition();
    initVoice();

    return () => {
      socket.current.disconnect();
      stopVisualizer();
    };
  }, []);

  const initializeRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false; // We use the button to trigger
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setTranscript("");
      setResponse("");
      setStatus("Listening...");
      startVisualizer();
    };

    recognition.onend = () => {
      setListening(false);
      stopVisualizer();
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      sendToAgent(text);
    };

    recognitionRef.current = recognition;
  };

  const sendToAgent = (text) => {
    setLoading(true);
    setStatus("Aurion is thinking...");
    socket.current.emit("stream-text", {
      text,
      isFinal: true, // Manual button mode always sends final text
      sessionId: sessionId.current,
      employeeId: "EMP001"
    });
  };

  const startListening = () => recognitionRef.current?.start();

  // --- Visualizer Logic ---
  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      drawWaveform();
    } catch (err) {
      console.error("Mic access denied for visualizer", err);
    }
  };

  const stopVisualizer = () => {
    cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const drawWaveform = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(59, 130, 246)`; // Blue bars
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  return (
    <div style={styles.container}>
      <h2>🎤 Aurion HR Agent</h2>
      <p style={{ color: "#94a3b8", fontSize: "14px" }}>Status: {status}</p>

      <button
        onClick={startListening}
        disabled={listening || loading}
        style={{
          ...styles.button,
          backgroundColor: listening ? "#ef4444" : "#3b82f6",
        }}
      >
        {listening ? "Listening..." : "Start Speaking"}
      </button>

      <div style={{ height: "120px", marginTop: "20px" }}>
        {listening && (
          <canvas
            ref={canvasRef}
            width={500}
            height={100}
            style={{ borderRadius: "10px", width: "100%" }}
          />
        )}
      </div>

      <div style={styles.card}>
        <h4 style={styles.label}>You said:</h4>
        <p>{transcript || "—"}</p>
      </div>

      <div style={styles.card}>
        <h4 style={styles.label}>Aurion Response:</h4>
        <p>{response || "—"}</p>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: "600px", margin: "40px auto", padding: "30px", textAlign: "center", background: "#0f172a", borderRadius: "16px", color: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
  button: { padding: "15px 30px", fontSize: "18px", border: "none", borderRadius: "12px", cursor: "pointer", color: "white", transition: "0.3s", fontWeight: "bold" },
  card: { marginTop: "20px", padding: "20px", background: "#1e293b", borderRadius: "12px", textAlign: "left", borderLeft: "4px solid #3b82f6" },
  label: { margin: "0 0 10px 0", fontSize: "12px", color: "#60a5fa", textTransform: "uppercase" }
};

export default VoiceInput;
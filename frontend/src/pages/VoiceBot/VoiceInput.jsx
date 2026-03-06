import React, { useState, useRef, useEffect } from "react";
import { speak, initVoice } from "../../utils/speechService";

const VoiceInput = ({ apiUrl = "http://localhost:3000/api/agent" }) => {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    initializeRecognition();
    window.speechSynthesis.onvoiceschanged = initVoice;
    initVoice();
  }, []);

  const initializeRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = async () => {
      setListening(true);
      setTranscript("");
      setResponse("");
      await startVisualizer();
    };

    recognition.onend = () => {
      setListening(false);
      stopVisualizer();
    };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      await sendToBackend(text);
    };

    recognitionRef.current = recognition;
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const sendToBackend = async (text) => {
    try {
      setLoading(true);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sessionId: sessionId.current }),
      });

      setResponse("Let me check for you");
      const data = await res.json();
      setResponse(data.reply);

      // 🔥 Use modular speech service
      speak(data.reply);

    } catch (err) {
      setResponse("Server error.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Waveform Visualizer
  const startVisualizer = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    const source =
      audioContextRef.current.createMediaStreamSource(stream);

    source.connect(analyserRef.current);

    drawWaveform();
  };

  const stopVisualizer = () => {
    cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];

        ctx.fillStyle = `rgb(${barHeight + 100}, 100, 255)`;
        ctx.fillRect(
          x,
          canvas.height - barHeight / 2,
          barWidth,
          barHeight / 2
        );

        x += barWidth + 1;
      }
    };

    draw();
  };

  return (
    <div style={styles.container}>
      <h2>🎤 HR Voice Bot</h2>

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

      {listening && (
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          style={{ marginTop: 20, borderRadius: 10 }}
        />
      )}

      {loading && <p style={{ marginTop: 10 }}>Processing...</p>}

      <div style={styles.card}>
        <h4>Employee Said:</h4>
        <p>{transcript || "—"}</p>
      </div>

      <div style={styles.card}>
        <h4>HR Bot Response:</h4>
        <p>{response || "—"}</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "700px",
    margin: "40px auto",
    padding: "20px",
    textAlign: "center",
    background: "#0f172a",
    borderRadius: "12px",
    color: "white",
  },
  button: {
    padding: "12px 25px",
    fontSize: "16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    color: "white",
  },
  card: {
    marginTop: "20px",
    padding: "15px",
    background: "#1f2937",
    borderRadius: "8px",
    textAlign: "left",
  },
};

export default VoiceInput;
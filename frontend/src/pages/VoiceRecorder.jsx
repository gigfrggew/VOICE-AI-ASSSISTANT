import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import API_URL from "../services/api";

function VoiceRecorder({ accessToken, onVoiceMessage, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [message, setMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const silenceCheckRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const shouldContinueRef = useRef(false);
  const restartTimerRef = useRef(null);
  const currentAudioRef = useRef(null);
  const cancelRecordingRef = useRef(false);

  async function startRecording() {
    if (!shouldContinueRef.current) {
      shouldContinueRef.current = true;
      setIsConversationActive(true);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!shouldContinueRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      hasSpokenRef.current = false;
      cancelRecordingRef.current = false;

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (silenceCheckRef.current) {
          cancelAnimationFrame(silenceCheckRef.current);
          silenceCheckRef.current = null;
        }

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }

        if (audioContextRef.current) {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        }

        mediaRecorderRef.current = null;

        if (cancelRecordingRef.current || !shouldContinueRef.current) {
          return;
        }

        await convertSpeechToText(audioBlob);
      };

      mediaRecorder.start();

      setIsRecording(true);
      setIsConversationActive(true);
      setMessage("Listening...");

      detectSilence();
    } catch (error) {
      console.error("Microphone Error:", error);
      shouldContinueRef.current = false;
      setIsRecording(false);
      setIsConversationActive(false);
      setMessage("Failed to access microphone");
    }
  }

  function detectSilence() {
    if (!analyserRef.current || !shouldContinueRef.current) {
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.fftSize);

    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const normalizedValue = (dataArray[i] - 128) / 128;
      sum += normalizedValue * normalizedValue;
    }

    const volume = Math.sqrt(sum / dataArray.length);
    const silenceThreshold = 0.015;

    if (volume > silenceThreshold) {
      hasSpokenRef.current = true;

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else if (hasSpokenRef.current && !silenceTimerRef.current) {
      silenceTimerRef.current = setTimeout(() => {
        stopRecording(true);
      }, 1500);
    }

    silenceCheckRef.current = requestAnimationFrame(detectSilence);
  }

  function stopRecording(isAutomatic = false) {
    if (!isAutomatic) {
      shouldContinueRef.current = false;
      cancelRecordingRef.current = true;
      setIsConversationActive(false);

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (isAutomatic) {
        setMessage("Converting speech to text...");
      }
    }
  }

  function restartListening() {
    if (!shouldContinueRef.current) {
      return;
    }

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }

    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;

      if (shouldContinueRef.current) {
        startRecording();
      }
    }, 300);
  }

  async function convertSpeechToText(audioBlob) {
    try {
      const response = await fetch(`${API_URL}/voice/speech-to-text`, {
        method: "POST",
        headers: {
          "Content-Type": audioBlob.type || "audio/webm",
          Authorization: `Bearer ${accessToken}`,
        },
        body: audioBlob,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to convert speech to text");
      }

      const transcript = data.transcript;

      if (!transcript || !transcript.trim()) {
        throw new Error("No speech was detected");
      }

      if (!shouldContinueRef.current) {
        return;
      }

      setMessage("Getting AI response...");

      const aiResponse = await onVoiceMessage(transcript);

      if (!shouldContinueRef.current) {
        return;
      }

      if (aiResponse) {
        await convertTextToSpeech(aiResponse);
      } else {
        setMessage("AI response could not be generated");
        restartListening();
      }
    } catch (error) {
      console.error("Speech To Text Error:", error);

      if (shouldContinueRef.current) {
        setMessage(error.message);
        restartListening();
      }
    }
  }

  async function convertTextToSpeech(text) {
    try {
      setMessage("Generating AI voice...");

      const response = await fetch(`${API_URL}/voice/text-to-speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to generate speech");
      }

      const audioBlob = await response.blob();

      if (!shouldContinueRef.current) {
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      currentAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;

        if (shouldContinueRef.current) {
          setMessage("");
          restartListening();
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;

        if (shouldContinueRef.current) {
          setMessage("Failed to play AI voice");
          restartListening();
        }
      };

      await audio.play();

      if (shouldContinueRef.current) {
        setMessage("AI is speaking...");
      }
    } catch (error) {
      console.error("Text To Speech Error:", error);

      if (shouldContinueRef.current) {
        setMessage(error.message);
        restartListening();
      }
    }
  }

  return (
    <div className="voice-recorder">
      <button
        type="button"
        className={`voice-record-button ${isRecording ? "recording" : ""}`}
        onClick={isRecording ? () => stopRecording(false) : startRecording}
        disabled={disabled && !isRecording}
        title={isRecording ? "Stop Voice Conversation" : "Start Voice Conversation"}
        aria-label={isRecording ? "Stop Voice Conversation" : "Start Voice Conversation"}
      >
        {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={22} />}
      </button>

      {message && <p className="voice-status">{message}</p>}
    </div>
  );
}

export default VoiceRecorder;
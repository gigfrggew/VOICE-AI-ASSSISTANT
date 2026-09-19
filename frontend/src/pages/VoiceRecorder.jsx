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

  const isAISpeakingRef = useRef(false);

  const aiMonitorStreamRef = useRef(null);
  const aiMonitorContextRef = useRef(null);
  const aiMonitorAnalyserRef = useRef(null);
  const aiMonitorCheckRef = useRef(null);
  const aiUserSpeechDetectedRef = useRef(false);

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

  async function startAIMicrophoneMonitor() {
    try {
      if (!shouldContinueRef.current || !isAISpeakingRef.current) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!shouldContinueRef.current || !isAISpeakingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      aiMonitorStreamRef.current = stream;

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      aiMonitorContextRef.current = audioContext;
      aiMonitorAnalyserRef.current = analyser;
      aiUserSpeechDetectedRef.current = false;

      console.log("AI speaking - microphone monitor started");

      monitorAISpeech();
    } catch (error) {
      console.error("AI microphone monitor error:", error);
    }
  }

  function monitorAISpeech() {
    if (!aiMonitorAnalyserRef.current || !isAISpeakingRef.current) {
      return;
    }

    const analyser = aiMonitorAnalyserRef.current;
    const dataArray = new Uint8Array(analyser.fftSize);

    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const normalizedValue = (dataArray[i] - 128) / 128;
      sum += normalizedValue * normalizedValue;
    }

    const volume = Math.sqrt(sum / dataArray.length);
    const voiceThreshold = 0.02;

    if (volume > voiceThreshold && !aiUserSpeechDetectedRef.current) {
      aiUserSpeechDetectedRef.current = true;

      console.log("User voice detected while AI is speaking");

      handleAIInterruption();
      return;
    }

    aiMonitorCheckRef.current = requestAnimationFrame(monitorAISpeech);
  }

  async function handleAIInterruption() {
    if (!isAISpeakingRef.current || !shouldContinueRef.current) {
      return;
    }

    console.log("Interrupting AI voice...");

    isAISpeakingRef.current = false;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    await stopAIMicrophoneMonitor();

    setMessage("Listening...");

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (!mediaRecorderRef.current) {
      startRecording();
    }
  }

  async function stopAIMicrophoneMonitor() {
    if (aiMonitorCheckRef.current) {
      cancelAnimationFrame(aiMonitorCheckRef.current);
      aiMonitorCheckRef.current = null;
    }

    if (aiMonitorStreamRef.current) {
      aiMonitorStreamRef.current.getTracks().forEach((track) => track.stop());
      aiMonitorStreamRef.current = null;
    }

    if (aiMonitorContextRef.current) {
      try {
        await aiMonitorContextRef.current.close();
      } catch (error) {
        console.error("AI monitor audio context error:", error);
      }

      aiMonitorContextRef.current = null;
    }

    aiMonitorAnalyserRef.current = null;
    aiUserSpeechDetectedRef.current = false;
  }
function stopRecording(isAutomatic = false) {
  if (!isAutomatic) {
    shouldContinueRef.current = false;
    cancelRecordingRef.current = true;
    setIsConversationActive(false);
    setMessage("");

    isAISpeakingRef.current = false;
    stopAIMicrophoneMonitor();

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

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
      isAISpeakingRef.current = true;

      await startAIMicrophoneMonitor();

      audio.onended = async () => {
        isAISpeakingRef.current = false;

        await stopAIMicrophoneMonitor();

        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;

        if (shouldContinueRef.current) {
          setMessage("");
          restartListening();
        }
      };

      audio.onerror = async () => {
        isAISpeakingRef.current = false;

        await stopAIMicrophoneMonitor();

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
      isAISpeakingRef.current = false;
      await stopAIMicrophoneMonitor();

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
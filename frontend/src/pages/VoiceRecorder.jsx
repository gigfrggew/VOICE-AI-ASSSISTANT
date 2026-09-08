import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import API_URL from "../services/api";

function VoiceRecorder({ accessToken, onVoiceMessage, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (audioStreamRef.current) {
          audioStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());
        }

        await convertSpeechToText(audioBlob);
      };

      mediaRecorder.start();

      setIsRecording(true);
      setMessage("Recording...");
    } catch (error) {
      console.error("Microphone Error:", error);
      setMessage("Failed to access microphone");
    }
  }

  function stopRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();

      setIsRecording(false);
      setMessage("Converting speech to text...");
    }
  }

  async function convertSpeechToText(audioBlob) {
    try {
      const response = await fetch(
        `${API_URL}/voice/speech-to-text`,
        {
          method: "POST",

          headers: {
            "Content-Type": audioBlob.type || "audio/webm",
            Authorization: `Bearer ${accessToken}`,
          },

          body: audioBlob,

          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to convert speech to text"
        );
      }

      const transcript = data.transcript;

      if (!transcript || !transcript.trim()) {
        throw new Error("No speech was detected");
      }

      setMessage("Getting AI response...");

      const aiResponse = await onVoiceMessage(transcript);

      if (aiResponse) {
        await convertTextToSpeech(aiResponse);
      } else {
        setMessage("AI response could not be generated");
      }
    } catch (error) {
      console.error("Speech To Text Error:", error);
      setMessage(error.message);
    }
  }

  async function convertTextToSpeech(text) {
    try {
      setMessage("Generating AI voice...");

      const response = await fetch(
        `${API_URL}/voice/text-to-speech`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },

          credentials: "include",

          body: JSON.stringify({
            text,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.error ||
            data.message ||
            "Failed to generate speech"
        );
      }

      const audioBlob = await response.blob();

      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setMessage("");
      };

      await audio.play();

      setMessage("AI is speaking...");
    } catch (error) {
      console.error("Text To Speech Error:", error);
      setMessage(error.message);
    }
  }

  return (
    <div className="voice-recorder">
      <button
        type="button"
        className={`voice-record-button ${
          isRecording ? "recording" : ""
        }`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled && !isRecording}
        title={isRecording ? "Stop Recording" : "Start Recording"}
        aria-label={isRecording ? "Stop Recording" : "Start Recording"}
      >
        {isRecording ? (
          <Square size={18} fill="currentColor" />
        ) : (
          <Mic size={22} />
        )}
      </button>

      {message && (
        <p className="voice-status">
          {message}
        </p>
      )}
    </div>
  );
}

export default VoiceRecorder;
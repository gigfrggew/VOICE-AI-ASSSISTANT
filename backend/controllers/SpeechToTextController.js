import { speechToText } from "../services/SpeechToTextService.js";

async function SpeechToTextController(req, res) {
  try {
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({
        message: "Audio data is required",
      });
    }

    const contentType = req.headers["content-type"] || "audio/wav";

    const transcript = await speechToText(req.body, contentType);

    return res.status(200).json({
      message: "Speech converted to text successfully",
      transcript: transcript,
    });
  } catch (error) {
    console.error("Speech To Text Controller Error:", error);

    return res.status(500).json({
      message: "Failed to convert speech to text",
      error: error.message,
    });
  }
}

export {
  SpeechToTextController,
};
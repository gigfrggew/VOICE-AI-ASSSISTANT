import { textToSpeech } from "../services/TextToSpeechService.js";

async function TextToSpeechController(req, res) {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Text is required",
      });
    }

    const audioResponse = await textToSpeech(text);
    const audioArrayBuffer = await audioResponse.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "inline; filename=speech.mp3");

    return res.status(200).send(audioBuffer);
  } catch (error) {
    console.error("Text To Speech Controller Error:", error);

    return res.status(500).json({
      message: "Failed to generate speech",
      error: error.message,
    });
  }
}

export {
  TextToSpeechController,
};
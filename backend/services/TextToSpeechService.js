import { DeepgramClient } from "@deepgram/sdk";
import dotenv from "dotenv";

dotenv.config();

const deepgram = new DeepgramClient({
  apiKey: process.env.DEEPGRAM_API_KEY,
});

async function textToSpeech(text) {
  if (!text || !text.trim()) {
    throw new Error(
      "Text is required for speech generation"
    );
  }

  try {
    const response =
      await deepgram
        .speak
        .v1
        .audio
        .generate({
          text: text,
          model: "aura-2-thalia-en",
          encoding: "mp3",
        });

    return response;

  } catch (error) {
    console.error(
      "Deepgram Text-to-Speech Error:",
      error
    );

    throw error;
  }
}

export {
  textToSpeech,
};
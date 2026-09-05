import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});

async function testGPTOSS() {
  try {
    const response = await client.chat.completions.create({
     model: "minimax/minimax-m3:free",
      messages: [
        {
          role: "user",
          content: "Hello. Introduce yourself in one sentence."
        }
      ]
    });

    console.log("GPT-OSS response:");
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenRouter Error:");
    console.error(error);
  }
}

testGPTOSS();
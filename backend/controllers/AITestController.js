import {GetAIResponse} from "../services/AIService.js";

async function AITestController(req, res) {
  try {
    const systemPrompt =
      "You are a helpful AI assistant for a small business.";

    const userMessage = "Say hello and tell me what you can do.";

    const response = await GetAIResponse(
      systemPrompt,
      userMessage
    );

    return res.status(200).json({
      message: "AI response received successfully",
      response,
    });
  } catch (error) {
    console.error("AI Test Error:", error);

    return res.status(500).json({
      message: "AI request failed",
      error: error.message,
    });
  }
}

export default AITestController;
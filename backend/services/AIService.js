import OpenAI from "openai";
import dotenv from "dotenv";

import {
  checkAvailability,
  createEvent,
  updateEvent,
  deleteEvent,
} from "./CalendarService.js";

dotenv.config();

const ai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = "minimax/minimax-m3:free";

const calendarTools = [
  {
    type: "function",
    function: {
      name: "check_calendar_availability",
      description: "Check whether a time slot is available in Google Calendar.",
      parameters: {
        type: "object",
        properties: {
          startTime: {
            type: "string",
            description: "Start date and time in ISO 8601 format.",
          },
          endTime: {
            type: "string",
            description: "End date and time in ISO 8601 format.",
          },
        },
        required: ["startTime", "endTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a new event in Google Calendar.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Title of the calendar event.",
          },
          description: {
            type: "string",
            description: "Description of the calendar event.",
          },
          startTime: {
            type: "string",
            description: "Start date and time in ISO 8601 format.",
          },
          endTime: {
            type: "string",
            description: "End date and time in ISO 8601 format.",
          },
        },
        required: ["summary", "startTime", "endTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_calendar_event",
      description: "Update or reschedule an existing Google Calendar event.",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "Google Calendar event ID.",
          },
          summary: {
            type: "string",
            description: "Updated event title.",
          },
          description: {
            type: "string",
            description: "Updated event description.",
          },
          startTime: {
            type: "string",
            description: "Updated start date and time in ISO 8601 format.",
          },
          endTime: {
            type: "string",
            description: "Updated end date and time in ISO 8601 format.",
          },
        },
        required: ["eventId", "startTime", "endTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_calendar_event",
      description: "Cancel or delete an existing Google Calendar event.",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "Google Calendar event ID.",
          },
        },
        required: ["eventId"],
      },
    },
  },
];

async function ExecuteCalendarTool(functionCall, business) {
  const name = functionCall.name;
  const args = functionCall.args;

  if (
    !business.googleCalendar ||
    !business.googleCalendar.connected ||
    !business.googleCalendar.refreshToken
  ) {
    return {
      success: false,
      error: "Google Calendar is not connected for this business.",
    };
  }

  const refreshToken = business.googleCalendar.refreshToken;
  const calendarId = business.googleCalendar.calendarId || "primary";

  try {
    if (name === "check_calendar_availability") {
      const result = await checkAvailability(
        refreshToken,
        args.startTime,
        args.endTime,
        calendarId
      );

      return {
        success: true,
        ...result,
      };
    }

    if (name === "create_calendar_event") {
      const result = await createEvent(
        refreshToken,
        {
          summary: args.summary,
          description: args.description,
          startTime: args.startTime,
          endTime: args.endTime,
          timeZone: "Asia/Kolkata",
        },
        calendarId
      );

      return {
        success: true,
        eventId: result.id,
        summary: result.summary,
        start: result.start,
        end: result.end,
        htmlLink: result.htmlLink,
      };
    }

    if (name === "update_calendar_event") {
      const result = await updateEvent(
        refreshToken,
        args.eventId,
        {
          summary: args.summary,
          description: args.description,
          startTime: args.startTime,
          endTime: args.endTime,
          timeZone: "Asia/Kolkata",
        },
        calendarId
      );

      return {
        success: true,
        eventId: result.id,
        summary: result.summary,
        start: result.start,
        end: result.end,
        htmlLink: result.htmlLink,
      };
    }

    if (name === "delete_calendar_event") {
      const result = await deleteEvent(
        refreshToken,
        args.eventId,
        calendarId
      );

      return {
        success: true,
        ...result,
      };
    }

    return {
      success: false,
      error: `Unknown calendar function: ${name}`,
    };
  } catch (error) {
    console.error(`Calendar Tool Error (${name}):`, error);

    return {
      success: false,
      error: error.message,
    };
  }
}

async function GetAIResponse(systemPrompt, userMessage, business) {
  try {
    let messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    for (let i = 0; i < 5; i++) {
      const response = await ai.chat.completions.create({
        model: MODEL,
        messages,
        tools: calendarTools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1000,
      });

      console.log("FULL OPENROUTER RESPONSE:");
      console.log(JSON.stringify(response, null, 2));

      if (response.error) {
        throw new Error(
          `OpenRouter provider error: ${response.error.message}`
        );
      }

      if (!response.choices || !response.choices[0]) {
        throw new Error("OpenRouter returned no choices.");
      }

      const assistantMessage = response.choices[0].message;

      const assistantMessageForHistory = {
        role: "assistant",
        content: assistantMessage.content || null,
        tool_calls: assistantMessage.tool_calls || undefined,
      };

      if (assistantMessage.reasoning_details) {
        assistantMessageForHistory.reasoning_details =
          assistantMessage.reasoning_details;
      }

      messages.push(assistantMessageForHistory);

      if (
        !assistantMessage.tool_calls ||
        assistantMessage.tool_calls.length === 0
      ) {
        return assistantMessage.content;
      }

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log("AI requested tool:", functionName);
        console.log("Tool arguments:", functionArgs);

        const toolResult = await ExecuteCalendarTool(
          {
            name: functionName,
            args: functionArgs,
          },
          business
        );

        console.log("Tool result:", toolResult);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    throw new Error("AI exceeded the maximum number of tool calls.");
  } catch (error) {
    console.error("OpenRouter AI Error:", error);
    throw error;
  }
}

async function GetCapturedData(fields, conversationHistory) {
  try {
    const fieldInstructions = fields
      .map(
        (field) =>
          `Field name: ${field.name}
Question: ${field.question}
Required: ${field.required}`
      )
      .join("\n\n");

    const systemPrompt = `
You are a data extraction assistant.

Extract information from the customer conversation.

The available fields are:

${fieldInstructions}

Conversation:

${conversationHistory}

Rules:
- Return only information that the customer actually provided.
- Do not guess or invent values.
- Use the exact field names provided.
- If a field has not been provided, do not include it.
- Return ONLY a JSON object.
- Do not return explanations.
- Do not return markdown.
- Your entire response must start with { and end with }.
`;

    const response = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: "Extract the captured information from this conversation.",
        },
      ],
      temperature: 0,
      max_tokens: 500,
    });

    let content = response.choices[0].message.content;

    console.log("Captured Data AI Response:");
    console.log(content);

    content = content.trim();

    const startIndex = content.indexOf("{");
    const endIndex = content.lastIndexOf("}");

    if (startIndex === -1 || endIndex === -1) {
      console.error("AI did not return valid JSON:", content);
      return {};
    }

    content = content.substring(startIndex, endIndex + 1);

    return JSON.parse(content);
  } catch (error) {
    console.error("OpenRouter Data Extraction Error:", error);
    return {};
  }
}

export {
  GetAIResponse,
  GetCapturedData,
};
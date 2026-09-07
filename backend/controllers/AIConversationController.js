import Business from "../models/BusinessModel.js";
import Workflow from "../models/WorkFlowModel.js";
import Conversation from "../models/ConversationModel.js";

import {
  GetAIResponse,
  GetCapturedData,
} from "../services/AIService.js";

import EvaluateConditions from "../services/ConditionService.js";


async function AIConversationController(req, res) {

  try {

    const {
      businessId,
      workflowId,
      conversationId,
      userMessage,
    } = req.body;


    // ---------------------------------------
    // 1. Check business ownership
    // ---------------------------------------

    let business;

    if (req.user.role === "business_owner") {
      business = await Business.findOne({
        _id: businessId,
        owner: req.user._id,
      });
    } else if (req.user.role === "customer") {
      business = await Business.findOne({
        _id: businessId,
      });
    }

    if (!business) {
      return res.status(404).json({
        message: "Business not found or you are not authorized",
      });
    }


    // ---------------------------------------
    // 2. Check workflow
    // ---------------------------------------

    const workflow = await Workflow.findOne({
      _id: workflowId,
      business: businessId,
    });


    if (!workflow) {

      return res.status(404).json({
        message:
          "Workflow not found for this business",
      });

    }


    // ---------------------------------------
    // 3. Find or create conversation
    // ---------------------------------------

    let conversation;


    if (conversationId) {

      conversation =
        await Conversation.findOne({

          _id: conversationId,

          business: businessId,

          workflow: workflowId,

        });


      if (!conversation) {

        return res.status(404).json({
          message:
            "Conversation not found",
        });

      }

    } else {

      conversation =
        await Conversation.create({

          business: businessId,

          workflow: workflowId,

          callerPhone: "test-user",

          transcript: [],

        });

    }


    // ---------------------------------------
    // 4. Add user message
    // ---------------------------------------

    conversation.transcript.push({

      role: "user",

      message: userMessage,

    });


    // ---------------------------------------
    // 5. Convert workflow fields into
    //    AI instructions
    // ---------------------------------------

    const fields = workflow.fields
      .map(
        (field) =>
          `Field: ${field.name}
Question: ${field.question}
Required: ${field.required}`
      )
      .join("\n\n");


    // ---------------------------------------
    // 6. Create conversation history
    // ---------------------------------------

    const conversationHistory =
      conversation.transcript
        .map(
          (message) =>
            `${message.role === "user"
              ? "Customer"
              : "Assistant"}: ${message.message
            }`
        )
        .join("\n");


    // ---------------------------------------
    // 7. Build AI system prompt
    // ---------------------------------------

    const systemPrompt = `
You are an AI receptionist for a small business.

Follow the business workflow below.

Workflow Name:
${workflow.workflowName}

Trigger:
${workflow.trigger}

Greeting:
${workflow.greeting}

Information to collect:
${fields}

Workflow Closing Message:
${workflow.closingMessage}

Workflow Action:
${workflow.action}


CALENDAR TOOL RULES:

You have access to the business owner's Google Calendar through tools.

Available Calendar actions:

1. check_calendar_availability
   Use this to check whether a requested appointment date and
   time is available.

2. create_calendar_event
   Use this to actually create and book an appointment or callback.

3. update_calendar_event
   Use this when the customer wants to reschedule or update
   an existing appointment.

4. delete_calendar_event
   Use this when the customer wants to cancel an appointment.


BOOKING PRIORITY RULES:

If the customer is requesting an appointment, booking, callback,
reservation, or another action that requires a date and time,
the Calendar rules take priority over the workflow closing message.

Do NOT simply send the workflow closing message after collecting
the appointment information.

When all required appointment information has been collected:

1. If the customer has provided a date and time, use
   check_calendar_availability to check whether the requested
   time is available.

2. If the requested time is unavailable, tell the customer that
   the time is unavailable and ask for another date or time.

3. If the requested time is available, ask the customer to confirm
   the booking unless the customer has already clearly confirmed
   that they want the appointment booked.

4. After the customer explicitly confirms the booking, use
   create_calendar_event.

5. Never tell the customer that an appointment has been booked
   unless create_calendar_event has successfully completed.

6. Never say that the business team will contact the customer
   to confirm the appointment when Google Calendar booking is
   available and the requested appointment can be booked.

7. The workflow closing message should only be used after the
   required Calendar action has been successfully completed,
   or when no Calendar action is required.


IMPORTANT CALENDAR BEHAVIOR:

- Do not pretend that a calendar operation happened.
- Always use the appropriate Calendar tool for real Calendar actions.
- When booking a requested time, check availability first.
- If the requested time is unavailable, tell the customer and
  ask for another suitable time.
- If the customer asks whether a time is available, only check
  availability. Do not automatically create an event.
- If the customer explicitly asks you to book a requested time,
  check availability first and create the event if available.
- If you ask the customer for confirmation before booking,
  wait for the customer's confirmation before creating the event.
- After a Calendar tool returns a result, use that result when
  responding to the customer.
- Never invent Calendar event IDs, availability, or booking status.
- Use Asia/Kolkata timezone for appointments unless another
  timezone is explicitly provided.


GENERAL RULES:

- Be polite and conversational.
- Follow the workflow.
- Ask the configured questions naturally.
- Collect all required information.
- If the customer has already provided information, do not ask
  for it again.
- Do not invent information.
- Do not ask unnecessary questions.
- Keep responses concise.
- This conversation will eventually be used for a voice assistant.


Previous conversation:

${conversationHistory}
`;


    // ---------------------------------------
    // 8. Generate AI response
    // ---------------------------------------

    const aiResponse =
      await GetAIResponse(
        systemPrompt,
        userMessage,
        business
      );


    // ---------------------------------------
    // 9. Add AI response to transcript
    // ---------------------------------------

    conversation.transcript.push({

      role: "assistant",

      message: aiResponse,

    });


    // ---------------------------------------
    // 10. Create updated conversation history
    // ---------------------------------------

    const updatedConversationHistory =
      conversation.transcript
        .map(
          (message) =>
            `${message.role === "user"
              ? "Customer"
              : "Assistant"}: ${message.message
            }`
        )
        .join("\n");


    // ---------------------------------------
    // 11. Extract captured information
    // ---------------------------------------

    const capturedData =
      await GetCapturedData(
        workflow.fields,
        updatedConversationHistory
      );


    // ---------------------------------------
    // 12. Save captured information
    // ---------------------------------------

    conversation.capturedData =
      capturedData;


    // ---------------------------------------
    // 13. Check required fields
    // ---------------------------------------

    const requiredFields =
      workflow.fields.filter(
        (field) =>
          field.required === true
      );


    const allRequiredFieldsCollected =
      requiredFields.every(
        (field) => {

          const value =
            capturedData[field.name];

          return (
            value !== undefined &&
            value !== null &&
            value !== ""
          );

        }
      );


    // ---------------------------------------
    // 14. Evaluate workflow conditions
    // ---------------------------------------

    const matchedConditions =
      EvaluateConditions(
        workflow.conditions,
        capturedData
      );


    // ---------------------------------------
    // 15. Mark conversation completed
    // ---------------------------------------

    if (allRequiredFieldsCollected) {

      conversation.status =
        "completed";

      conversation.action =
        workflow.action;

      conversation.followUpStatus =
        "pending";

    }


    // ---------------------------------------
    // 16. Save conversation
    // ---------------------------------------

    await conversation.save();


    // ---------------------------------------
    // 17. Return response
    // ---------------------------------------

    return res.status(200).json({

      message:
        "AI conversation response generated successfully",

      conversationId:
        conversation._id,

      response:
        aiResponse,

      capturedData:
        conversation.capturedData,

      status:
        conversation.status,

      action:
        conversation.action,

      followUpStatus:
        conversation.followUpStatus,

      matchedConditions,

      transcript:
        conversation.transcript,

    });

  } catch (error) {

    console.error(
      "AI Conversation Error:",
      error
    );


    return res.status(500).json({

      message:
        "AI conversation failed",

      error:
        error.message,

    });

  }

}


export default AIConversationController;
import Conversation from "../models/ConversationModel.js";
import Business from "../models/BusinessModel.js";
import Workflow from "../models/WorkFlowModel.js";

async function CreateConversationController(req, res) {
  try {
    const {
      businessId,
      workflowId,
      callerPhone,
      callerName,
      intent,
      capturedData,
    } = req.body;

    const business = await Business.findOne({
      _id: businessId,
      owner: req.user._id,
    });

    if (!business) {
      return res.status(404).json({
        message: "Business not found or you are not authorized",
      });
    }

    const workflow = await Workflow.findOne({
      _id: workflowId,
      business: businessId,
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found for this business",
      });
    }

    const conversation = await Conversation.create({
      business: businessId,
      workflow: workflowId,
      callerPhone,
      callerName,
      intent,
      capturedData,
    });

    return res.status(201).json({
      message: "Conversation created successfully",
      conversation,
    });
  } catch (error) {
    console.error("Create Conversation Error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}


async function GetConversationController(req, res) {
  try {
    const { businessId } = req.query;

    const business = await Business.findOne({
      _id: businessId,
      owner: req.user._id,
    });

    if (!business) {
      return res.status(404).json({
        message: "Business not found or you are not authorized",
      });
    }

    const conversations = await Conversation.find({
      business: businessId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Conversations fetched successfully",
      conversations,
    });
  } catch (error) {
    console.error("Get Conversation Error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function UpdateConversationController(req, res) {
  try {
    const { conversationId } = req.params;

    const {
      callerName,
      status,
      intent,
      capturedData,
      summary,
      action,
      urgency,
      followUpStatus,
      transcript,
    } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      business: {
        $in: await Business.find({
          owner: req.user._id,
        }).distinct("_id"),
      },
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found or you are not authorized",
      });
    }

    if (callerName !== undefined) {
      conversation.callerName = callerName;
    }

    if (status !== undefined) {
      conversation.status = status;
    }

    if (intent !== undefined) {
      conversation.intent = intent;
    }

    if (capturedData !== undefined) {
      conversation.capturedData = capturedData;
    }

    if (summary !== undefined) {
      conversation.summary = summary;
    }

    if (action !== undefined) {
      conversation.action = action;
    }

    if (urgency !== undefined) {
      conversation.urgency = urgency;
    }

    if (followUpStatus !== undefined) {
      conversation.followUpStatus = followUpStatus;
    }

    if (transcript !== undefined) {
      conversation.transcript = transcript;
    }

    await conversation.save();

    return res.status(200).json({
      message: "Conversation updated successfully",
      conversation,
    });
  } catch (error) {
    console.error("Update Conversation Error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

export {CreateConversationController,GetConversationController,UpdateConversationController};
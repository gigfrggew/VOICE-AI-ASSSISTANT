import Business from "../models/BusinessModel.js";
import Workflow from "../models/WorkFlowModel.js";

async function FindBusinessController(req, res) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Business phone number is required",
      });
    }

    const business = await Business.findOne({
      phone: phone.trim(),
    }).select("_id businessName businessType phone description");

    if (!business) {
      return res.status(404).json({
        message: "Business not found",
      });
    }

    const workflow = await Workflow.findOne({
      business: business._id,
    }).sort({ createdAt: 1 });

    if (!workflow) {
      return res.status(404).json({
        message: "This business does not have an active workflow",
      });
    }

    return res.status(200).json({
      message: "Business found",
      business,
      workflow: {
        id: workflow._id,
        workflowName: workflow.workflowName,
      },
    });
  } catch (error) {
    console.error("Find Business Error:", error);

    return res.status(500).json({
      message: "Failed to find business",
    });
  }
}

async function GetCustomerWorkflowController(req, res) {
  try {
    const { businessId, workflowId } = req.params;

    if (req.user.role !== "customer") {
      return res.status(403).json({
        message: "Only customers can access this route",
      });
    }

    const business = await Business.findOne({
      _id: businessId,
    }).select("_id businessName businessType phone description");

    if (!business) {
      return res.status(404).json({
        message: "Business not found",
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

    return res.status(200).json({
      message: "Business and workflow fetched successfully",
      business,
      workflow,
    });
  } catch (error) {
    console.error("Get Customer Workflow Error:", error);

    return res.status(500).json({
      message: "Failed to load customer conversation",
    });
  }
}

export {
  FindBusinessController,
  GetCustomerWorkflowController,
};
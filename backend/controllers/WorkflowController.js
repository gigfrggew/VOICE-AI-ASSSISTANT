import Workflow from "../models/WorkFlowModel.js";
import Business from "../models/BusinessModel.js";


async function CreateWorkflowController(req, res) {
  try {

    const {
      businessId,
      workflowName,
      trigger,
      greeting,
      fields,
      conditions,
      closingMessage,
      action,
    } = req.body;


    const business = await Business.findOne({
      _id: businessId,
      owner: req.user._id,
    });


    if (!business) {
      return res.status(404).json({
        message: "Business not found or you are not the owner",
      });
    }


    const workflow = await Workflow.create({
      business: business._id,
      workflowName,
      trigger,
      greeting,
      fields,
      conditions,
      closingMessage,
      action,
    });


    res.status(201).json({
      message: "Workflow created successfully",

      workflow: {
        id: workflow._id,
        business: workflow.business,
        workflowName: workflow.workflowName,
        trigger: workflow.trigger,
        greeting: workflow.greeting,
        fields: workflow.fields,
        conditions: workflow.conditions,
        closingMessage: workflow.closingMessage,
        action: workflow.action,
        followUpStatus: workflow.followUpStatus,
      },
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Something went wrong while creating the workflow",
    });
  }
}


async function GetWorkflowController(req, res) {
  try {

    const { businessId } = req.query;


    const business = await Business.findOne({
      _id: businessId,
      owner: req.user._id,
    });


    if (!business) {
      return res.status(404).json({
        message: "Business not found or you are not the owner",
      });
    }


    const workflows = await Workflow.find({
      business: business._id,
    });


    res.status(200).json({
      message: "Workflows fetched successfully",
      workflows,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Something went wrong while fetching workflows",
    });
  }
}



async function GetSingleWorkflowController(req, res) {
  try {
    const { workflowId } = req.params;

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }

    const business = await Business.findOne({
      _id: workflow.business,
      owner: req.user._id,
    });

    if (!business) {
      return res.status(403).json({
        message: "You are not authorized to view this workflow",
      });
    }

    res.status(200).json({
      message: "Workflow fetched successfully",
      workflow,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong while fetching the workflow",
    });
  }
}


async function UpdateWorkflowController(req, res) {
  try {

    const { workflowId } = req.params;


    const {
      workflowName,
      trigger,
      greeting,
      fields,
      conditions,
      closingMessage,
      action,
    } = req.body;


    const workflow = await Workflow.findById(workflowId);


    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }


    const business = await Business.findOne({
      _id: workflow.business,
      owner: req.user._id,
    });


    if (!business) {
      return res.status(403).json({
        message: "You are not authorized to update this workflow",
      });
    }


    workflow.workflowName = workflowName;
    workflow.trigger = trigger;
    workflow.greeting = greeting;
    workflow.fields = fields;
    workflow.conditions = conditions;
    workflow.closingMessage = closingMessage;
    workflow.action = action;


    await workflow.save();


    res.status(200).json({
      message: "Workflow updated successfully",

      workflow: {
        id: workflow._id,
        business: workflow.business,
        workflowName: workflow.workflowName,
        trigger: workflow.trigger,
        greeting: workflow.greeting,
        fields: workflow.fields,
        conditions: workflow.conditions,
        closingMessage: workflow.closingMessage,
        action: workflow.action,
        followUpStatus: workflow.followUpStatus,
      },
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Something went wrong while updating the workflow",
    });
  }
}


export {
  GetWorkflowController,
  CreateWorkflowController,
  UpdateWorkflowController,
  GetSingleWorkflowController
};
import Business from "../models/BusinessModel.js";

import {
    getGoogleAuthUrl,
    getGoogleOAuthClient,
    checkAvailability,
    createEvent,
    updateEvent,
    deleteEvent,
} from "../services/CalendarService.js";


async function GoogleAuthController(req, res) {
    try {
        const { businessId } = req.query;

        if (!businessId) {
            return res.status(400).json({
                message: "Business ID is required",
            });
        }

        // Check that this business belongs to the logged-in user
        const business = await Business.findOne({
            _id: businessId,
            owner: req.user._id,
        });

        if (!business) {
            return res.status(404).json({
                message: "Business not found or unauthorized",
            });
        }

        const authUrl = getGoogleAuthUrl(businessId);

        res.redirect(authUrl);

    } catch (error) {
        console.error("Google Auth Error:", error);

        res.status(500).json({
            message: "Failed to generate Google authorization URL",
        });
    }
}


async function GoogleCallbackController(req, res) {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).json({
                message: "Authorization code is missing",
            });
        }

        if (!state) {
            return res.status(400).json({
                message: "Business ID is missing",
            });
        }

        // Find the business and make sure it belongs to the logged-in user
        const business = await Business.findOne({
            _id: state,
            owner: req.user._id,
        });

        if (!business) {
            return res.status(404).json({
                message: "Business not found or unauthorized",
            });
        }

        const oauth2Client = getGoogleOAuthClient();

        const { tokens } = await oauth2Client.getToken(code);

        // Save Google refresh token
        if (tokens.refresh_token) {
            business.googleCalendar.refreshToken = tokens.refresh_token;
        }

        business.googleCalendar.connected = true;

        await business.save();

        console.log("Google Calendar connected successfully");

        res.json({
            message: "Google Calendar connected successfully",
        });

    } catch (error) {
        console.error("Google OAuth Callback Error:", error);

        res.status(500).json({
            message: "Google OAuth failed",
        });
    }
}

async function CheckAvailabilityController(req, res) {
    try {
        const {
            businessId,
            startTime,
            endTime,
        } = req.body;

        if (!businessId || !startTime || !endTime) {
            return res.status(400).json({
                message: "businessId, startTime and endTime are required",
            });
        }

        const business = await Business.findOne({
            _id: businessId,
            owner: req.user._id,
        });

        if (!business) {
            return res.status(404).json({
                message: "Business not found or unauthorized",
            });
        }

        if (
            !business.googleCalendar ||
            !business.googleCalendar.connected ||
            !business.googleCalendar.refreshToken
        ) {
            return res.status(400).json({
                message: "Google Calendar is not connected",
            });
        }

        const result = await checkAvailability(
            business.googleCalendar.refreshToken,
            startTime,
            endTime,
            business.googleCalendar.calendarId
        );

        res.status(200).json({
            message: "Calendar availability checked successfully",
            result,
        });

    } catch (error) {
        console.error("Check Availability Error:", error);

        res.status(500).json({
            message: "Failed to check calendar availability",
        });
    }
}


async function CreateEventController(req, res) {
    try {
        const {
            businessId,
            summary,
            description,
            startTime,
            endTime,
            attendees,
            timeZone,
        } = req.body;

        if (!businessId || !summary || !startTime || !endTime) {
            return res.status(400).json({
                message:
                    "businessId, summary, startTime and endTime are required",
            });
        }

        const business = await Business.findOne({
            _id: businessId,
            owner: req.user._id,
        });

        if (!business) {
            return res.status(404).json({
                message: "Business not found or unauthorized",
            });
        }

        if (
            !business.googleCalendar ||
            !business.googleCalendar.connected ||
            !business.googleCalendar.refreshToken
        ) {
            return res.status(400).json({
                message: "Google Calendar is not connected",
            });
        }

        const event = await createEvent(
            business.googleCalendar.refreshToken,
            {
                summary,
                description,
                startTime,
                endTime,
                attendees,
                timeZone,
            },
            business.googleCalendar.calendarId
        );

        res.status(201).json({
            message: "Calendar event created successfully",
            event: {
                id: event.id,
                summary: event.summary,
                start: event.start,
                end: event.end,
                endTime: event.end,
                htmlLink: event.htmlLink,
            },
        });

    } catch (error) {
        console.error("Create Event Error:", error);

        res.status(500).json({
            message: "Failed to create calendar event",
        });
    }
}


async function UpdateEventController(req, res) {
    try {
        const {
            businessId,
            summary,
            description,
            startTime,
            endTime,
            attendees,
            timeZone,
        } = req.body;

        const { eventId } = req.params;

        if (!businessId || !eventId || !startTime || !endTime) {
            return res.status(400).json({
                message:
                    "businessId, eventId, startTime and endTime are required",
            });
        }

        // Check business ownership
        const business = await Business.findOne({
            _id: businessId,
            owner: req.user._id,
        });

        if (!business) {
            return res.status(404).json({
                message: "Business not found or unauthorized",
            });
        }

        // Check Google Calendar connection
        if (
            !business.googleCalendar ||
            !business.googleCalendar.connected ||
            !business.googleCalendar.refreshToken
        ) {
            return res.status(400).json({
                message: "Google Calendar is not connected",
            });
        }

        // Update Google Calendar event
        const event = await updateEvent(
            business.googleCalendar.refreshToken,
            eventId,
            {
                summary,
                description,
                startTime,
                endTime,
                attendees,
                timeZone,
            },
            business.googleCalendar.calendarId
        );

        res.status(200).json({
            message: "Calendar event updated successfully",

            event: {
                id: event.id,
                summary: event.summary,
                start: event.start,
                end: event.end,
                htmlLink: event.htmlLink,
            },
        });

    } catch (error) {
        console.error("Update Event Error:", error);

        res.status(500).json({
            message: "Failed to update calendar event",
        });
    }
}


async function DeleteEventController(req, res) {
  try {
    const { businessId } = req.body;
    const { eventId } = req.params;

    if (!businessId || !eventId) {
      return res.status(400).json({
        message: "businessId and eventId are required",
      });
    }

    const business = await Business.findOne({
      _id: businessId,
      owner: req.user._id,
    });

    if (!business) {
      return res.status(404).json({
        message: "Business not found or unauthorized",
      });
    }

    if (
      !business.googleCalendar ||
      !business.googleCalendar.connected ||
      !business.googleCalendar.refreshToken
    ) {
      return res.status(400).json({
        message: "Google Calendar is not connected",
      });
    }

    await deleteEvent(
      business.googleCalendar.refreshToken,
      eventId,
      business.googleCalendar.calendarId
    );

    res.status(200).json({
      message: "Calendar event deleted successfully",
      eventId,
    });

  } catch (error) {
    console.error("Delete Event Error:", error);

    res.status(500).json({
      message: "Failed to delete calendar event",
    });
  }
}


export {
    GoogleAuthController,
    GoogleCallbackController,
    CheckAvailabilityController,
    CreateEventController,
    UpdateEventController,
    DeleteEventController,
};
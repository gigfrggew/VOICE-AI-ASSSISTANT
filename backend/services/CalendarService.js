import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();


// Create Google OAuth client
function getGoogleOAuthClient() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    return oauth2Client;
}


// Generate Google OAuth authorization URL
function getGoogleAuthUrl(state) {
    const oauth2Client = getGoogleOAuthClient();

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",

        scope: [
            "https://www.googleapis.com/auth/calendar",
        ],

        prompt: "consent",

        state: state,
    });

    return authUrl;
}


// Create an authenticated Google Calendar client
function getAuthenticatedCalendarClient(refreshToken) {
    const oauth2Client = getGoogleOAuthClient();

    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client,
    });

    return calendar;
}


// Check Google Calendar availability
async function checkAvailability(
    refreshToken,
    startTime,
    endTime,
    calendarId = "primary"
) {
    const calendar = getAuthenticatedCalendarClient(refreshToken);

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: startTime,
            timeMax: endTime,
            items: [
                {
                    id: calendarId,
                },
            ],
        },
    });

    const calendarData = response.data.calendars[calendarId];

    return {
        busy: calendarData.busy,
        available: calendarData.busy.length === 0,
    };
}


async function createEvent(
    refreshToken,
    eventData,
    calendarId = "primary"
) {
    const calendar = getAuthenticatedCalendarClient(refreshToken);

    const response = await calendar.events.insert({
        calendarId: calendarId,

        requestBody: {
            summary: eventData.summary,

            description: eventData.description || "",

            start: {
                dateTime: eventData.startTime,
                timeZone: eventData.timeZone || "Asia/Kolkata",
            },

            end: {
                dateTime: eventData.endTime,
                timeZone: eventData.timeZone || "Asia/Kolkata",
            },

            attendees: eventData.attendees || [],
        },
    });

    return response.data;
}

async function updateEvent(
    refreshToken,
    eventId,
    eventData,
    calendarId = "primary"
) {
    const calendar = getAuthenticatedCalendarClient(refreshToken);

    const response = await calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,

        requestBody: {
            summary: eventData.summary,

            description: eventData.description || "",

            start: {
                dateTime: eventData.startTime,
                timeZone: eventData.timeZone || "Asia/Kolkata",
            },

            end: {
                dateTime: eventData.endTime,
                timeZone: eventData.timeZone || "Asia/Kolkata",
            },

            attendees: eventData.attendees || [],
        },
    });

    return response.data;
}


async function deleteEvent(
    refreshToken,
    eventId,
    calendarId = "primary"
) {
    const calendar = getAuthenticatedCalendarClient(refreshToken);

    await calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
    });

    return {
        success: true,
        eventId,
    };
}

export {
    getGoogleOAuthClient,
    getGoogleAuthUrl,
    getAuthenticatedCalendarClient,
    checkAvailability,
    createEvent,
    updateEvent,
    deleteEvent,
};
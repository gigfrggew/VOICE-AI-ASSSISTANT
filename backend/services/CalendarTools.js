const calendarTools = [
  {
    name: "check_calendar_availability",
    description:
      "Check whether a requested date and time is available in the business owner's Google Calendar. Use this before creating a new appointment or callback.",
    parameters: {
      type: "object",
      properties: {
        startTime: {
          type: "string",
          description:
            "Appointment start time in ISO 8601 format with timezone offset.",
        },
        endTime: {
          type: "string",
          description:
            "Appointment end time in ISO 8601 format with timezone offset.",
        },
      },
      required: ["startTime", "endTime"],
    },
  },

  {
    name: "create_calendar_event",
    description:
      "Create a new appointment or callback event in the business owner's Google Calendar. Use this only after availability has been checked and the customer has confirmed the appointment when confirmation is required.",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Short title of the calendar event.",
        },
        description: {
          type: "string",
          description: "Description of the appointment.",
        },
        startTime: {
          type: "string",
          description:
            "Event start time in ISO 8601 format with timezone offset.",
        },
        endTime: {
          type: "string",
          description:
            "Event end time in ISO 8601 format with timezone offset.",
        },
      },
      required: [
        "summary",
        "description",
        "startTime",
        "endTime",
      ],
    },
  },

  {
    name: "update_calendar_event",
    description:
      "Reschedule or update an existing Google Calendar event.",
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
          description:
            "New event start time in ISO 8601 format with timezone offset.",
        },
        endTime: {
          type: "string",
          description:
            "New event end time in ISO 8601 format with timezone offset.",
        },
      },
      required: [
        "eventId",
        "summary",
        "description",
        "startTime",
        "endTime",
      ],
    },
  },

  {
    name: "delete_calendar_event",
    description:
      "Cancel or delete an existing Google Calendar event.",
    parameters: {
      type: "object",
      properties: {
        eventId: {
          type: "string",
          description:
            "Google Calendar event ID to cancel.",
        },
      },
      required: ["eventId"],
    },
  },
];

export default calendarTools;
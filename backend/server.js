import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import SignUpRoute from "./routes/SignUpRoute.js"
import LoginRoute from "./routes/LoginRoute.js";
import RefreshTokenRoute from "./routes/RefreshTokenRoute.js";
import AuthRoute from "./routes/AuthRoute.js"
import CreateBusinessRoute from "./routes/BusinessRoute.js";
import CreateWorkflowRoute from "./routes/WorkflowRoute.js";
import ConversationRoute from "./routes/ConversationRoute.js";
import AIConversationRoute from "./routes/AIConversationRoute.js";
import cookieParser from "cookie-parser";
import AITestRoute from "./routes/AITestRoute.js";
import CalendarRoute from "./routes/CalendarRoute.js";
import CustomerRoute from "./routes/CustomerRoute.js";
import LogoutRoute from "./routes/LogoutRoute.js";
import VoiceRoute from "./routes/TextToSpeechRoute.js";
import SpeechToTextRoute from "./routes/SpeechToTextRoute.js";

import dotenv from "dotenv";
dotenv.config();


const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://voice-ai-asssistant.vercel.app",
  
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser())

connectDB();

app.get("/", (req, res) => {
  res.json("VOICE-AI Backend is running");
});

app.use("/signup", SignUpRoute)
app.use("/login", LoginRoute);
app.use("/refresh", RefreshTokenRoute);
app.use("/protected",AuthRoute)
app.use("/business", CreateBusinessRoute);
app.use("/workflow", CreateWorkflowRoute);
app.use("/conversation", ConversationRoute);
app.use("/ai-test", AITestRoute);
app.use("/ai-conversation", AIConversationRoute);
app.use("/calendar", CalendarRoute);
app.use("/customer", CustomerRoute);
app.use("/logout", LogoutRoute);
app.use("/voice", VoiceRoute);
app.use("/voice",SpeechToTextRoute);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
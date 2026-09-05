import User from "../models/UserModel.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config();

async function AuthMiddleware(req, res,next) {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json("access token required")
        }

        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET)

        const user = await User.findById(decoded.userId)

        if (!user) {
            return res.status(401).json("user not found")
        }


        req.user = user;

        next();
    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Access token expired",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid access token",
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Something went wrong while authenticating",
        });
    }
}

export default AuthMiddleware
import jwt from "jsonwebtoken"
import User from "../models/UserModel.js"
import dotenv from "dotenv"
dotenv.config()

async function RefreshTokenController(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json("refreshToken is required")
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

        const user = await User.findById(decoded.userId)

        if (!user) {
            return res.status(401).json("user not found")
        }

        if (user.refreshToken !== refreshToken) {
            return res.status(401).json("refresh token expired or invalid")
        }



        const accessToken = jwt.sign(
            {
                userId: decoded.userId,
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: "1d"
            }
        )

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "Access token refreshed successfully",
        });

    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Refresh token expired. Please login again.",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid refresh token",
            });
        }

        return res.status(500).json({
            message: "Something went wrong while refreshing token",
        });
    }
}

export default RefreshTokenController
import express from "express"
import AuthMiddleware from "../middleware/AuthMiddleware.js"

const router = express.Router();

router.get("/", AuthMiddleware, (req, res) => {
    res.status(200).json({
        message: "You are authenticated",
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
        },
    });
})

export default router;
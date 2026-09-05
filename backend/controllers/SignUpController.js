import bcrypt from "bcryptjs";
import User from "../models/UserModel.js";

async function SignUpController(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (!["business_owner", "customer"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);

    res.status(500).json({
      message: "Something went wrong while registering the user",
    });
  }
}

export default SignUpController;
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const express = require("express");
const cors = require ("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db")

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials : true
}))

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: "true",
        message: "Login Dashboard API is Running"
    });
});

const startserver = async() => {
    try {
       await connectDB();
     
        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
           console.log(`Server running on PORT ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startserver();
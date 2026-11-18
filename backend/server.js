const express = require("express");
const cors = require ("cors");
require("dotenv").config();

const app = express();

app.use(cors({
    origin: "http://localhost:5173"
}))

app.get("/", (req, res) => {
    res.send("Login Dashboard Backend is Running");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('Server running on PORT {$PORT}');
})
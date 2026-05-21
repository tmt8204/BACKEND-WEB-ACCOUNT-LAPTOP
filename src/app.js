const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Test route to verify server is running
app.get('/test', (req, res) => {
       res.status(200).json({ message: "Server is running!" });
   });


module.exports = app;

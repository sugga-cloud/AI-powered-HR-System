import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";

import resumeRoutes from "./routes/resumeRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";

import shortlistingRoutes from "./routes/shortlistingRoutes.js";

const app = express();
const port = process.env.PORT || 4000;

await connectDB();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send("✅ Resume Parsing Microservice Running"));

app.use("/api/resume", resumeRoutes);
app.use("/api/jobs", jobRoutes);

app.use("/api/shortlisting", shortlistingRoutes); 

app.listen(port, () => console.log(`🚀 Server running on ${port}`));

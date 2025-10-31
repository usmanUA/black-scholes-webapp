import express from "express";
import cors from "cors";
import { execSync } from "child_process";
import fs from "fs";
import type { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 8080;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET"]
}));

app.get("/api/run", (request: Request, response: Response) => {
    const scenario = request.query.scenario || "1";
    console.log(`Received request for scenario: ${scenario}`);

    try {
	console.log(`Running scenario: ${scenario}`);

	execSync(`/app/run.sh ${scenario}`, { stdio: "inherit" });

	const delta_plot = "/app/data/delta_plot.png";
	const gamma_plot = "/app/data/gamma_plot.png";

	if (!fs.existsSync(delta_plot) || !fs.existsSync(gamma_plot)) {
	    console.error("The files for one or both plots are missing");
	    console.log("Files in /app/data:", fs.readdirSync("/app/data"));
	    return response.status(404).json({ error: "Files for plot(s) not found" });
	}

	console.log("Error plots are found, encoding them to base64");
	const delta = fs.readFileSync(delta_plot, "base64");
	const gamma = fs.readFileSync(gamma_plot, "base64");

	response.json({ delta, gamma });
    } catch (error) {
	response.status(500).json({ error: "Computation failed" });
    }
});

app.listen(PORT, () => console.log(`Backend app running on ${PORT}`));

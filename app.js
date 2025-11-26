import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { handleErrorsAndCleanup } from "./middleware/error.middleware.js";
import path from "path";

const app = express();

// --- Global Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public upload folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// --- API Routes ---
app.get("/", (req, res) => {
    res
        .status(200)
        .json({ message: "Welcome to the Express ES6 Boilerplate API!" });
});
app.use("/api", apiRoutes);

// --- Error Handling Middleware ---
app.use(handleErrorsAndCleanup);

export default app;
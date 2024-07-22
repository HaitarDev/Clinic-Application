import dotenv from "dotenv";
dotenv.config({ path: `${process.cwd()}/.env` });
import express from "express";
const morgan = require("morgan");

import { rateLimit } from "express-rate-limit";

import authRoute from "./routes/authRoute";
import userRoute from "./routes/userRoute";
import appointementRoute from "./routes/appointementRoute";

import { AppError } from "./utils/appError";
import { errorController } from "./controllers/errorController";
import helmet from "helmet";

const app = express();
// security ----------------
app.use(helmet());

const limit = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many request from this IP, please try again later",
});

// middlewares -------------
app.use(limit);
app.use(express.json());
app.use(morgan("dev"));

// routes ------------------

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/appointement", appointementRoute);

// if didnt match any of routes on top
/// throw the error
app.all("*", (req, res, next) => {
  next(new AppError(401, "Path url not exist !"));
});

/// read the error
// error middleware
app.use(errorController);
// server ------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

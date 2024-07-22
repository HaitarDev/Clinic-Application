import { Router } from "express";
import {
  protectController,
  restrictTo,
} from "../controllers/protectedController";
import { Role } from "@prisma/client";
import { requestAppointement } from "../controllers/appointementController";

const router = Router();

// as a patient make an appointement
router
  .route("/")
  .post(
    protectController,
    restrictTo(Role.PATIENT, Role.ADMIN),
    requestAppointement
  );

export default router;

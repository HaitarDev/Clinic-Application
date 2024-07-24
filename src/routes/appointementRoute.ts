import { Router } from "express";
import {
  protectController,
  restrictTo,
} from "../controllers/protectedController";
import { Role } from "@prisma/client";
import {
  getDoctorAppointement,
  MakeAppointementDone,
  requestAppointement,
} from "../controllers/appointementController";

const router = Router();

// as a patient make an appointement
router
  .route("/")
  .post(
    protectController,
    restrictTo(Role.PATIENT, Role.ADMIN),
    requestAppointement
  );

router
  .route("/doctor")
  .get(protectController, restrictTo(Role.DOCTOR), getDoctorAppointement);

router
  .route("/:id")
  .patch(protectController, restrictTo(Role.DOCTOR), MakeAppointementDone);

// get one appointement
// edit one appointements
export default router;

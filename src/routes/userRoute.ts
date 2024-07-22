import { Router } from "express";
import {
  getAllUsers,
  updatePassword,
  updateUserRole,
} from "../controllers/userController";
import {
  protectController,
  restrictTo,
} from "../controllers/protectedController";
import { Role } from "@prisma/client";

const router = Router();

router.route("/").get(protectController, restrictTo(Role.ADMIN), getAllUsers);
router.route("/update-password").patch(protectController, updatePassword);
router
  .route("/update-role")
  .patch(protectController, restrictTo(Role.ADMIN), updateUserRole);

export default router;

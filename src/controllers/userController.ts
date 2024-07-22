import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";
import bcrypt from "bcryptjs";
import { AppError } from "../utils/appError";
import { Prisma, Role, User } from "@prisma/client";
import { sentToken, signToken } from "../utils/authToken";

export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const users = await prisma.user.findMany({
      select: {
        password: false,
        confirmPassword: false,
        email: true,
        id: true,
        gender: true,
        name: true,
        role: true,
      },
    });
    return res.status(200).json({
      status: "success",
      users,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      message: "Fail to get all users",
    });
  }
}

export async function updatePassword(
  req: Request<
    {},
    {},
    { oldPassword: string; newPassword: string; confirmNewPassword: string }
  > & { user?: User },
  res: Response,
  next: NextFunction
) {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    const currUser = await prisma.user.findUnique({
      where: {
        id: req.user?.id,
      },
    });
    if (!currUser) return next(new AppError(401, "User not found"));

    const compare = await bcrypt.compare(oldPassword, currUser.password);
    if (!compare) {
      console.log("asaaaaa");
      return next(new AppError(401, "your password are incorrect"));
    }

    if (newPassword !== confirmNewPassword)
      return next(
        new AppError(401, "Your password and confirm-password are incompatible")
      );

    const generateNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: currUser.id,
      },
      data: {
        password: generateNewPassword,
      },
    });
    return res.status(203).json({
      status: "success",
      message: "password updated succefully.",
    });
  } catch (error) {
    return next(new AppError(400, "Error occur while updating the password"));
  }
}

export async function updateUserRole(
  req: Request<
    {},
    {},
    { id: string; role: Role; specialization?: string } & { user: User }
  >,
  res: Response,
  next: NextFunction
) {
  try {
    let userRoleInfo:
      | (Prisma.Without<
          Prisma.UserUpdateInput,
          Prisma.UserUncheckedUpdateInput
        > &
          Prisma.UserUncheckedUpdateInput)
      | (Prisma.Without<
          Prisma.UserUncheckedUpdateInput,
          Prisma.UserUpdateInput
        > &
          Prisma.UserUpdateInput);

    const user = await prisma.user.findUnique({
      where: { id: req.body.id },
      select: { patient: true, doctor: true },
    });

    if (!user) return next(new AppError(401, "There is no user"));

    if (req.body.role === "DOCTOR") {
      userRoleInfo = {
        role: req.body.role,
        doctor: {
          connectOrCreate: {
            where: {
              userId: req.body.id,
            },
            create: {
              specialization: req.body.specialization ?? "",
            },
          },
        },
      };
      if (user.patient) userRoleInfo.patient = { delete: true };
    } else if (req.body.role === "PATIENT") {
      userRoleInfo = {
        role: req.body.role,
        patient: {
          connectOrCreate: {
            where: {
              userId: req.body.id,
            },
            create: {},
          },
        },
      };
      if (user?.doctor) userRoleInfo.doctor = { delete: true };
    } else if (req.body.role === "ADMIN") {
      userRoleInfo = {
        role: req.body.role,
      };
      if (user?.doctor) userRoleInfo.doctor = { delete: true };
      if (user?.patient) userRoleInfo.patient = { delete: true };
    } else {
      userRoleInfo = {
        role: req.body.role,
      };
      if (user?.doctor) userRoleInfo.doctor = { delete: true };
      if (user?.patient) userRoleInfo.patient = { delete: true };
    }

    // console.log(userRoleInfo);
    const updatedUser = await prisma.user.update({
      where: {
        id: req.body.id,
      },
      data: userRoleInfo,
    });
    console.log(updatedUser);
    const freshToken = signToken(updatedUser.id);
    sentToken(res, freshToken, updatedUser);
  } catch (error: any) {
    console.log(error.message);
    return next(new AppError(400, "Error occur while updating the user role"));
  }
}

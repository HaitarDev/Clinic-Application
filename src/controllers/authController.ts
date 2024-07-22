import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sign } from "jsonwebtoken";
import { prisma } from "../db/prisma";
import isEmail from "validator/lib/isEmail";
import { User } from "@prisma/client";
import { sentEmail } from "../utils/email";
import { sentToken, signToken } from "../utils/authToken";

export async function registrerController(
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, name, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword)
      return next(new AppError(500, "There is no info"));

    if (!isEmail(email)) {
      return next(new AppError(401, "Email are not valid !"));
    }

    if (password !== confirmPassword) {
      return next(new AppError(401, "Passowrd are not incompatible"));
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: hashPassword,
      },
    });

    await prisma.patient.create({ data: { userId: user.id } });

    const token = signToken(user.id);

    sentToken(res, token, user);
  } catch (error) {
    next(new AppError(400, "Fail to register"));
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError(404, "There is no info"));
    }

    if (!isEmail(req.body.email)) {
      return next(new AppError(401, "Email are not valid !"));
    }

    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
      select: {
        password: true,
        id: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError(401, "Password are incorrect"));
    }

    const token = signToken(user.id);
    sentToken(res, token);
  } catch (error) {
    next(new AppError(400, "fail to login"));
  }
}

export async function forgotPasswordController(
  req: Request<{}, {}, { email: string }>,
  res: Response,
  next: NextFunction
) {
  console.log("asd");
  if (!req.body.email || !isEmail(req.body.email)) {
    return next(new AppError(401, "Please provide a valid email"));
  }

  const user = await prisma.user.findUnique({
    where: { email: req.body.email },
  });

  if (!user) {
    return next(new AppError(400, "Email is incorrect"));
  }
  // get a random token
  const token = crypto.randomBytes(32).toString("hex");

  // make a hash for the random token for more security
  const cryptedToken = crypto.createHash("sha256").update(token).digest("hex");

  // store the secure token to user
  await prisma.user.update({
    where: { id: user?.id },
    data: {
      passwordResetToken: cryptedToken,
    },
  });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/reset-password/${token}_${user.email}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and password-confirm to : ${resetURL}. \n If you didn't forget your password, please ignore this email !`;
  // return the normal token
  try {
    sentEmail({
      email: user.email,
      subject: "Token sent via email!",
      message,
    });

    return res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (error) {
    await prisma.user.update({
      where: { id: user?.id },
      data: {
        passwordResetToken: undefined,
      },
    });

    return next(
      new AppError(
        401,
        "There was an error sending the email. Try again later!"
      )
    );
  }
}

export async function resetPasswordController(
  req: Request<
    { tokenAndEmail: string },
    {},
    { password: string; confirmPassword: string }
  >,
  res: Response,
  next: NextFunction
) {
  const { password, confirmPassword } = req.body;
  const [token, email] = req.params.tokenAndEmail.split("_");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findUnique({
    where: {
      email,
      passwordResetToken: hashedToken,
    },
  });

  if (!user)
    return next(new AppError(401, "There is no user with this token or email"));

  if (password !== confirmPassword) {
    return next(new AppError(401, "Passowrd are not incompatible"));
  }

  const hashPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashPassword,
    },
  });

  const jwtToken = signToken(user.id);
  sentToken(res, jwtToken, user);
}

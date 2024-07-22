import { User } from "@prisma/client";
import { Response } from "express";
import { sign } from "jsonwebtoken";

export function signToken(id: string) {
  return sign({ id: id }, process.env.JWT_SECRET!, {
    expiresIn: "90d",
  });
}
export function sentToken(res: Response, token: string, user?: User) {
  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // convert 90d to ms from
    httpOnly: true,
    secure: false,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  return res.status(201).json({
    status: "success",
    user: {
      name: user?.name,
      email: user?.email,
      token,
    },
  });
}

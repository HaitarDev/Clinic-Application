import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import { prisma } from "../db/prisma";
import { User } from "@prisma/client";

export async function requestAppointement(
  req: Request<
    {},
    {},
    { doctorId: string; startDate: Date; endDate: Date } & { user: User }
  >,
  res: Response,
  next: NextFunction
) {
  try {
    // choose doctor you want
    const doctor = await prisma.doctor.findUnique({
      where: {
        id: req.body.doctorId,
      },
      include: {
        appointement: true,
      },
    });
    if (!doctor) return next(new AppError(404, "Doctor not found"));
    console.log(doctor?.appointement);
    // check if date is doctor available : offDays , schedule
    doctor?.appointement.filter((singleAppointement) => {
      const requestStart = req.body.startDate.getTime();
      const requestEnd = req.body.endDate.getTime();
      const existStart = singleAppointement.startDate.getTime();
      const existEnd = singleAppointement.endDate.getTime();

      console.log({ requestStart, existStart });
    });

    // make endDate time
    // return appointement info : id , time doctor name ...etc
  } catch (error) {
    return next(new AppError(400, "Error occur on making an appoinetement"));
  }
}

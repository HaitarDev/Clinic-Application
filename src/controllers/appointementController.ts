import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import { prisma } from "../db/prisma";
import { User } from "@prisma/client";
import { add, addHours } from "date-fns";
import {
  isAppointementNotAvailable,
  isThereAnAppointementWithSameDate,
} from "../utils/helpers";

export async function requestAppointement(
  req: Request<{}, {}, { doctorId: string; startDate: string }> & {
    user?: User;
  },
  res: Response,
  next: NextFunction
) {
  const { doctorId, startDate } = req.body;
  const endDate = add(new Date(startDate), { hours: 1 });
  const user = req.user;
  try {
    if (!user)
      return next(
        new AppError(400, "There is no user to set a new appointement")
      );

    // get patiend id
    const patient = await prisma.patient.findUnique({
      where: {
        userId: user.id,
      },
      select: { id: true, appointement: true },
    });
    if (!patient)
      return next(
        new AppError(404, "There is no patient ! please log in as a patient")
      );
    // if patient has already an appointement
    if (patient.appointement) {
      return next(new AppError(400, "The patient has already an appointement"));
    }
    // start date < 9 morning  || startdate > 5 evening
    if (isAppointementNotAvailable(startDate)) {
      return next(
        new AppError(
          400,
          "You can't set an appointement before 9 am and after 5 am or in the past"
        )
      );
    }

    // choose doctor you want
    const doctor = await prisma.doctor.findUnique({
      where: {
        id: doctorId,
      },
      include: {
        appointement: true,
      },
    });

    if (!doctor) return next(new AppError(404, "Doctor not found"));

    const isAlreadyReserved = isThereAnAppointementWithSameDate(
      doctor,
      startDate
    );

    if (isAlreadyReserved) {
      return next(
        new AppError(
          401,
          "There is already an appointement in this date you request"
        )
      );
    }

    // check if doctor available on offDays (LATER)

    await prisma.appointement.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        doctorId: doctorId,
        patientId: patient.id,
      },
    });

    // return the bilan too
    return res.status(200).json({
      status: "success",
      message: "New Appointement was created succefully",
    });
    // return appointement info : id , time doctor name ...etc
  } catch (error: any) {
    console.log(error.message);
    return next(new AppError(400, "Error occur on making an appoinetement"));
  }
}

export async function getDoctorAppointement(
  req: Request & { user?: User },
  res: Response,
  next: NextFunction
) {
  try {
    // check there is a doctor
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: req.user?.id,
      },
      include: { appointement: true },
    });
    if (!doctor)
      return next(new AppError(400, "Error occur on getDoctorAppointement"));

    // get-all-appointement
    return res.status(200).json({
      status: "success",
      data: doctor.appointement,
    });
  } catch (error: any) {
    console.log(error.message);
    return next(new AppError(400, "Error occur on getDoctorAppointement"));
  }
}

export async function MakeAppointementDone(
  req: Request<
    { id: string },
    {},
    {
      diseaseName: string;
      doctorNote: string;
      isControll: boolean;
      controllStartDate?: string;
    }
  > & { user?: User },
  res: Response,
  next: NextFunction
) {
  try {
    // check if there is an Appointement and the doctor
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: req.user?.id,
      },
      include: {
        appointement: {
          where: {
            id: req.params.id,
          },
        },
      },
    });
    const appointement = doctor?.appointement[0];

    if (!doctor || !appointement)
      return next(new AppError(400, "There is no doctor or appointement"));

    // if there is a controll set an appointement
    if (
      req.body.isControll &&
      isAppointementNotAvailable(req.body.controllStartDate!) &&
      isThereAnAppointementWithSameDate(doctor, req.body.controllStartDate!)
    ) {
      return next(
        new AppError(
          400,
          "You can set new appointement if no controll or the new date appointement are not valid , Try again! "
        )
      );
    }

    // get patient {id} from appointement
    const patientId = appointement.patientId;

    // add the info from here to appointementHisory in the patient
    const appointementHisory = await prisma.appointementHistory.create({
      data: {
        patientId,
        diseaseName: req.body.diseaseName,
        doctorNote: req.body.doctorNote,
        isThereIsControll: req.body.isControll,
        appointementDate: appointement.startDate,
      },
    });

    // remove the appointement
    await prisma.appointement.delete({
      where: {
        doctorId: doctor.id,
        patientId,
      },
    });

    let newAppointement;
    if (req.body.isControll) {
      const endDate = addHours(new Date(req.body.controllStartDate!), 1);
      newAppointement = await prisma.appointement.create({
        data: {
          startDate: new Date(req.body.controllStartDate!),
          endDate: new Date(endDate),
          doctorId: doctor.id,
          patientId: patientId,
        },
      });
    }
    return res.status(200).json({
      status: "success",
      data: {
        diseaseName: appointementHisory.diseaseName,
        isThereIsControll: appointementHisory.isThereIsControll,
        appointementDate: appointementHisory.appointementDate,
        nextAppointement: req.body.isControll
          ? newAppointement?.startDate
          : "You have no controll date",
      },
    });
  } catch (error: any) {
    console.log(error.message);
    return next(new AppError(400, "Error on MakeAppointementDone"));
  }
}

import { Appointement, Doctor } from "@prisma/client";
import {
  isAfter,
  isBefore,
  isPast,
  isSameDay,
  isSameHour,
  set,
} from "date-fns";

export function isAppointementNotAvailable(startDate: string): boolean {
  return (
    isBefore(new Date(startDate), set(new Date(startDate), { hours: 10 })) ||
    isAfter(new Date(startDate), set(new Date(startDate), { hours: 18 })) ||
    isPast(new Date(startDate))
  );
}

export function isThereAnAppointementWithSameDate(
  doctor: Doctor & { appointement: Appointement[] },
  startDate: string
): boolean {
  const isThereAnAppointement = doctor.appointement.findIndex((appoi) => {
    return (
      isSameDay(appoi.startDate, new Date(startDate)) &&
      isSameHour(appoi.startDate, new Date(startDate))
    );
  });
  console.log(isThereAnAppointement);
  return isThereAnAppointement === -1 ? false : true;
}

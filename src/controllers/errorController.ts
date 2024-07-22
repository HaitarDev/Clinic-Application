import { NextFunction, Request, Response } from "express";

// type ErrorController = {
//   err: Error & { statusCode: number; status: string };
//   req: Request;
//   res: Response;
//   next: NextFunction;
// };
export const errorController = (
  err: Error & { statusCode: number; status: string },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

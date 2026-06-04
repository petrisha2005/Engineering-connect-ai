import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    const errors = error.issues.reduce<Record<string, string>>((acc, issue) => {
      const field = String(issue.path.at(-1) ?? "");
      if (field && !acc[field]) acc[field] = issue.message;
      return acc;
    }, {});

    if (errors.github || errors.linkedin) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please fill all required profile fields.",
        errors
      });
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.issues
      }
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error"
    }
  });
}

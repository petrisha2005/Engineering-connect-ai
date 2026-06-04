import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { HydratedDocument, Types } from "mongoose";
import { env } from "../config/env.js";
import { firebaseAuth } from "../config/firebase.js";
import { User, type UserDocument } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

type AuthUserDocument = HydratedDocument<UserDocument> | null;

function attachRequestUser(req: Request, user: AuthUserDocument) {
  if (!user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authenticated user was not found");
  }

  req.user = {
    id: user._id as Types.ObjectId,
    firebaseUid: String(user.firebaseUid),
    email: String(user.email),
    displayName: String(user.displayName)
  };
}

async function authenticateWithBackendJwt(req: Request, token: string) {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  const userId = typeof decoded.sub === "string" ? decoded.sub : "";

  if (!userId) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Backend token is missing a user id");
  }

  const user = await User.findById(userId);
  attachRequestUser(req, user);
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Missing auth token"));
  }

  try {
    try {
      const decoded = await firebaseAuth.verifyIdToken(token);
      const email = decoded.email;

      if (!email) {
        throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Firebase token has no email");
      }

      const user = await User.findOneAndUpdate(
        { firebaseUid: decoded.uid },
        {
          firebaseUid: decoded.uid,
          email,
          displayName: decoded.name ?? email.split("@")[0],
          photoURL: decoded.picture,
          lastLoginAt: new Date()
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      attachRequestUser(req, user);
    } catch {
      await authenticateWithBackendJwt(req, token);
    }

    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Invalid auth token"));
  }
}

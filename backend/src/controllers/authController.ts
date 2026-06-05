import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { firebaseAuth } from "../config/firebase.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

function createBackendToken(user: { _id: unknown; firebaseUid: string; email: string }) {
  return jwt.sign(
    {
      sub: String(user._id),
      firebaseUid: user.firebaseUid,
      email: user.email
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

interface GoogleTokenInfo {
  sub?: string;
  aud?: string;
  email?: string;
  email_verified?: "true" | "false" | boolean;
  name?: string;
  picture?: string;
}

async function verifyGoogleIdToken(idToken: string) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);

  if (!response.ok) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Google sign-in token is invalid");
  }

  const tokenInfo = (await response.json()) as GoogleTokenInfo;

  if (tokenInfo.aud !== env.GOOGLE_CLIENT_ID) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "GOOGLE_CLIENT_MISMATCH", "Google token was issued for a different OAuth client");
  }

  if (!tokenInfo.sub || !tokenInfo.email) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "GOOGLE_PROFILE_INCOMPLETE", "Google token is missing profile details");
  }

  if (tokenInfo.email_verified === false || tokenInfo.email_verified === "false") {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "GOOGLE_EMAIL_UNVERIFIED", "Google email is not verified");
  }

  return tokenInfo;
}

export const createSession = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  }

  const user = await User.findById(req.user.id).populate("profile");

  if (!user) {
    throw new HttpError(StatusCodes.NOT_FOUND, "USER_NOT_FOUND", "Authenticated user was not found");
  }

  res.status(StatusCodes.OK).json({ success: true, user, token: createBackendToken(user) });
});

export const syncFirebaseSession = asyncHandler(async (req, res) => {
  const idToken =
    typeof req.body?.idToken === "string"
      ? req.body.idToken
      : req.header("Authorization")?.replace("Bearer ", "") ?? "";

  if (!idToken) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Missing auth token");
  }

  const decoded = await firebaseAuth.verifyIdToken(idToken);
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
  ).populate("profile");

  res.status(StatusCodes.OK).json({ success: true, user, token: createBackendToken(user) });
});

export const createGoogleSession = asyncHandler(async (req, res) => {
  const idToken = typeof req.body?.idToken === "string" ? req.body.idToken : "";

  if (!idToken) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "GOOGLE_TOKEN_REQUIRED", "Google ID token is required");
  }

  const googleUser = await verifyGoogleIdToken(idToken);
  const googleSub = googleUser.sub;
  const googleEmail = googleUser.email;

  if (!googleSub || !googleEmail) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "GOOGLE_PROFILE_INCOMPLETE", "Google token is missing profile details");
  }

  const firebaseUid = `google:${googleSub}`;
  const email = googleEmail.toLowerCase();
  const displayName = googleUser.name ?? email.split("@")[0];
  const photoURL = googleUser.picture;

  await firebaseAuth
    .updateUser(firebaseUid, {
      email,
      displayName,
      photoURL,
      emailVerified: true
    })
    .catch(async (error: { code?: string }) => {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }

      await firebaseAuth.createUser({
        uid: firebaseUid,
        email,
        displayName,
        photoURL,
        emailVerified: true
      });
    });

  const user = await User.findOneAndUpdate(
    { firebaseUid },
    {
      firebaseUid,
      email,
      displayName,
      photoURL,
      lastLoginAt: new Date()
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate("profile");

  const firebaseToken = await firebaseAuth.createCustomToken(firebaseUid, {
    email,
    displayName,
    photoURL
  });

  res.status(StatusCodes.OK).json({
    success: true,
    user,
    firebaseToken,
    token: createBackendToken(user)
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
  }

  const user = await User.findById(req.user.id).populate("profile");

  if (!user) {
    throw new HttpError(StatusCodes.NOT_FOUND, "USER_NOT_FOUND", "Authenticated user was not found");
  }

  res.status(StatusCodes.OK).json({ success: true, user, token: createBackendToken(user) });
});

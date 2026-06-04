export interface AppUser {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "student" | "admin";
  profile?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: AppUser;
  token?: string;
  firebaseToken?: string;
}

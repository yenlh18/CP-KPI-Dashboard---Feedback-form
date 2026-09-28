"use server";

import { signOut } from "@/auth";

export async function signOutAction(callbackUrl: string) {
  await signOut({ redirectTo: callbackUrl });
}

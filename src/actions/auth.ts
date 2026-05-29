"use server";

import { createSupabaseServerClient, supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function signUp(
  email: string,
  password: string,
  username: string,
) {
  const supabase = createSupabaseServerClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "User not created" };
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    auth_id: authData.user.id,
    username,
    role: "player",
  });

  if (profileError) {
    return { error: profileError.message };
  }

  return { success: true };
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getCurrentProfile() {
  const supabase = createSupabaseServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  return data;
}

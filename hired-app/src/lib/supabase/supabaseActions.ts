"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "./supabaseServer";

export async function getUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user };
}

export async function createRecord(
  table: string,
  record: object,
  revalidate?: string,
  userIdField = "user_id"
) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from(table)
    .insert({ [userIdField]: user?.id, ...record });
  if (error) return { error };
  if (revalidate) revalidatePath(revalidate);
  return { data };
}

export async function readRecords(table: string, query: object = {}) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from(table).select().match(query);
  if (error) return { error };
  return { data };
}

export async function updateRecord(
  table: string,
  id: string,
  updates: object,
  revalidate?: string
) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id);
  if (error) return { error };
  if (revalidate) revalidatePath(revalidate);
  return { data };
}

export async function deleteRecord(
  table: string,
  id: string,
  revalidate?: string
) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { error };
  if (revalidate) revalidatePath(revalidate);
  return { data };
}
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DealStage } from "@/lib/types";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function createContact(formData: FormData) {
  const { supabase, userId } = await getUserId();

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: userId,
      first_name: formData.get("first_name") as string,
      last_name: (formData.get("last_name") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      title: (formData.get("title") as string) || null,
      company_id: (formData.get("company_id") as string) || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  return data;
}

export async function updateContact(id: string, formData: FormData) {
  const { supabase } = await getUserId();

  const { error } = await supabase
    .from("contacts")
    .update({
      first_name: formData.get("first_name") as string,
      last_name: (formData.get("last_name") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      title: (formData.get("title") as string) || null,
      company_id: (formData.get("company_id") as string) || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
}

export async function createCompany(formData: FormData) {
  const { supabase, userId } = await getUserId();

  const { data, error } = await supabase
    .from("companies")
    .insert({
      user_id: userId,
      name: formData.get("name") as string,
      domain: (formData.get("domain") as string) || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/contacts");
  return data;
}

export async function createDeal(formData: FormData) {
  const { supabase, userId } = await getUserId();

  const { data, error } = await supabase
    .from("deals")
    .insert({
      user_id: userId,
      title: formData.get("title") as string,
      contact_id: (formData.get("contact_id") as string) || null,
      stage: (formData.get("stage") as DealStage) || "lead",
      value: parseFloat(formData.get("value") as string) || 0,
      expected_close_date: (formData.get("expected_close_date") as string) || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (data.contact_id) {
    await supabase.from("activities").insert({
      user_id: userId,
      contact_id: data.contact_id,
      type: "deal_stage_change",
      payload: { deal_id: data.id, title: data.title, stage: data.stage },
    });
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  if (data.contact_id) revalidatePath(`/contacts/${data.contact_id}`);
  return data;
}

export async function updateDealStage(dealId: string, stage: DealStage) {
  const { supabase, userId } = await getUserId();

  const { data: deal, error } = await supabase
    .from("deals")
    .update({ stage })
    .eq("id", dealId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (deal.contact_id) {
    await supabase.from("activities").insert({
      user_id: userId,
      contact_id: deal.contact_id,
      type: "deal_stage_change",
      payload: { deal_id: dealId, title: deal.title, stage },
    });
    revalidatePath(`/contacts/${deal.contact_id}`);
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function createTask(formData: FormData) {
  const { supabase, userId } = await getUserId();

  const contactId = (formData.get("contact_id") as string) || null;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: formData.get("title") as string,
      contact_id: contactId,
      due_date: (formData.get("due_date") as string) || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (contactId) {
    await supabase.from("activities").insert({
      user_id: userId,
      contact_id: contactId,
      type: "task",
      payload: { task_id: data.id, title: data.title, action: "created" },
    });
    revalidatePath(`/contacts/${contactId}`);
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return data;
}

export async function toggleTask(taskId: string, completed: boolean) {
  const { supabase } = await getUserId();

  const { data, error } = await supabase
    .from("tasks")
    .update({ completed })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (data.contact_id) revalidatePath(`/contacts/${data.contact_id}`);
}

export async function createNote(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const contactId = formData.get("contact_id") as string;
  const body = formData.get("body") as string;

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      contact_id: contactId,
      body,
      source: "manual",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contactId,
    type: "note",
    payload: { note_id: data.id, body: body.slice(0, 200), source: "manual" },
  });

  await supabase
    .from("contacts")
    .update({ last_contact_at: new Date().toISOString() })
    .eq("id", contactId);

  revalidatePath(`/contacts/${contactId}`);
  return data;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

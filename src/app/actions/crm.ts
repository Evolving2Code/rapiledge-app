"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseEmails, parseTags, readCustomFields } from "@/lib/forms";
import { requireUser } from "@/lib/supabase/server";
import type { DealStage } from "@/lib/types";

export async function createCompany(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Company name is required.");
  const { data, error } = await supabase
    .from("companies")
    .insert({
      owner_id: userId,
      name,
      domain: String(formData.get("domain") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/companies");
  redirect(`/companies/${data.id}`);
}

export async function updateCompany(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("companies")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      domain: String(formData.get("domain") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/companies/${id}`);
  revalidatePath("/companies");
}

export async function deleteCompany(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/companies");
  redirect("/companies");
}

export async function createContact(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name = String(formData.get("last_name") ?? "").trim();
  if (!first_name) throw new Error("First name is required.");
  const extraEmails = parseEmails(String(formData.get("emails") ?? ""));
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const custom_fields = readCustomFields(formData);

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      owner_id: userId,
      first_name,
      last_name,
      email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
      emails: extraEmails,
      phone: String(formData.get("phone") ?? "").trim() || null,
      job_title: String(formData.get("job_title") ?? "").trim() || null,
      company_id: String(formData.get("company_id") ?? "") || null,
      tags,
      custom_fields,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/contacts");
  redirect(`/contacts/${data.id}`);
}

export async function updateContact(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const { data: existing } = await supabase
    .from("contacts")
    .select("custom_fields")
    .eq("id", id)
    .single();
  const extraEmails = parseEmails(String(formData.get("emails") ?? ""));
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const custom_fields = readCustomFields(
    formData,
    (existing?.custom_fields ?? {}) as Record<string, string>,
  );

  const { error } = await supabase
    .from("contacts")
    .update({
      first_name: String(formData.get("first_name") ?? "").trim(),
      last_name: String(formData.get("last_name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
      emails: extraEmails,
      phone: String(formData.get("phone") ?? "").trim() || null,
      job_title: String(formData.get("job_title") ?? "").trim() || null,
      company_id: String(formData.get("company_id") ?? "") || null,
      tags,
      custom_fields,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function createNote(contactId: string, formData: FormData) {
  const { supabase, userId } = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Note cannot be empty.");
  const { error } = await supabase.from("notes").insert({
    owner_id: userId,
    contact_id: contactId,
    body,
    source: "manual",
  });
  if (error) throw new Error(error.message);
  await supabase.rpc("log_activity", {
    p_owner: userId,
    p_contact: contactId,
    p_type: "note",
    p_payload: { preview: body.slice(0, 180), source: "manual" },
  });
  revalidatePath(`/contacts/${contactId}`);
}

export async function createTask(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Task title is required.");
  const contactId = String(formData.get("contact_id") ?? "") || null;
  const due = String(formData.get("due_date") ?? "") || null;
  const { error } = await supabase.from("tasks").insert({
    owner_id: userId,
    contact_id: contactId,
    title,
    due_date: due ? new Date(due).toISOString() : null,
  });
  if (error) throw new Error(error.message);
  if (contactId) {
    await supabase.rpc("log_activity", {
      p_owner: userId,
      p_contact: contactId,
      p_type: "task",
      p_payload: { title },
    });
    revalidatePath(`/contacts/${contactId}`);
  }
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function toggleTask(id: string, completed: boolean) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("contact_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (data.contact_id) revalidatePath(`/contacts/${data.contact_id}`);
}

export async function createDeal(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Deal title is required.");
  const contactId = String(formData.get("contact_id") ?? "") || null;
  const { data, error } = await supabase
    .from("deals")
    .insert({
      owner_id: userId,
      title,
      contact_id: contactId,
      company_id: String(formData.get("company_id") ?? "") || null,
      stage: (String(formData.get("stage") ?? "lead") as DealStage) || "lead",
      value: Number(formData.get("value") ?? 0) || 0,
      expected_close_date: String(formData.get("expected_close_date") ?? "") || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  if (contactId) {
    await supabase.rpc("log_activity", {
      p_owner: userId,
      p_contact: contactId,
      p_type: "deal_stage_change",
      p_payload: { title, stage: String(formData.get("stage") ?? "lead") },
    });
    revalidatePath(`/contacts/${contactId}`);
  }
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  if (String(formData.get("next") ?? "") === "deal") {
    redirect(`/pipeline/${data.id}`);
  }
}

export async function updateDealStage(id: string, stage: DealStage) {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("deals")
    .update({ stage })
    .eq("id", id)
    .select("contact_id, title")
    .single();
  if (error) throw new Error(error.message);
  if (data.contact_id) {
    await supabase.rpc("log_activity", {
      p_owner: userId,
      p_contact: data.contact_id,
      p_type: "deal_stage_change",
      p_payload: { title: data.title, stage },
    });
    revalidatePath(`/contacts/${data.contact_id}`);
  }
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function updateDeal(id: string, formData: FormData) {
  const { supabase, userId } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const stage = String(formData.get("stage") ?? "lead") as DealStage;
  const contactId = String(formData.get("contact_id") ?? "") || null;
  const { data, error } = await supabase
    .from("deals")
    .update({
      title,
      stage,
      value: Number(formData.get("value") ?? 0) || 0,
      expected_close_date: String(formData.get("expected_close_date") ?? "") || null,
      contact_id: contactId,
      company_id: String(formData.get("company_id") ?? "") || null,
    })
    .eq("id", id)
    .select("contact_id, title")
    .single();
  if (error) throw new Error(error.message);
  if (data.contact_id) {
    await supabase.rpc("log_activity", {
      p_owner: userId,
      p_contact: data.contact_id,
      p_type: "deal_stage_change",
      p_payload: { title: data.title, stage },
    });
    revalidatePath(`/contacts/${data.contact_id}`);
  }
  revalidatePath(`/pipeline/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function deleteDeal(id: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("deals")
    .select("contact_id")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (data?.contact_id) revalidatePath(`/contacts/${data.contact_id}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect("/pipeline");
}

export async function deleteTask(id: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("tasks")
    .select("contact_id")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (data?.contact_id) revalidatePath(`/contacts/${data.contact_id}`);
}

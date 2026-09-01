import { DEAL_STAGES } from "@/lib/constants";
import type { DealStage } from "@/lib/types";

export function stageLabel(stage: DealStage | string) {
  return DEAL_STAGES.find((item) => item.id === stage)?.label ?? stage;
}

export function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseEmails(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function readCustomFields(
  formData: FormData,
  existing: Record<string, string> = {},
) {
  const fields: Record<string, string> = { ...existing };
  const reserved = ["dog_name", "dog_birthday"];
  const dog = String(formData.get("dog_name") ?? "").trim();
  const dogBirthday = String(formData.get("dog_birthday") ?? "").trim();
  if (dog) fields.dog_name = dog;
  else delete fields.dog_name;
  if (dogBirthday) fields.dog_birthday = dogBirthday;
  else delete fields.dog_birthday;

  const extraKey = String(formData.get("custom_key") ?? "").trim();
  const extraVal = String(formData.get("custom_value") ?? "").trim();
  if (extraKey && extraVal) fields[extraKey] = extraVal;
  if (extraKey && !extraVal && !reserved.includes(extraKey)) {
    delete fields[extraKey];
  }
  return fields;
}

export function extraCustomFields(fields: Record<string, string>) {
  return Object.entries(fields).filter(
    ([key]) => key !== "dog_name" && key !== "dog_birthday",
  );
}

export function sanitizeSearch(query: string) {
  return query.replace(/[%(),]/g, "").trim().slice(0, 80);
}

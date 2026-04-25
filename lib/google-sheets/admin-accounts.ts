import "server-only";

import { formatDateTime, type ManagedAdminAccount } from "@/lib/data-models";
import { appendRow, cell, readRows } from "./client";
import { adminAccountHeaders, adminAccountSheetName } from "./schemas";

function adminAccountToRow(account: ManagedAdminAccount) {
  return [
    account.username,
    account.password,
    account.display_name,
    account.is_enabled ? "TRUE" : "FALSE",
    account.updated_at,
  ];
}

function rowToAdminAccount(row: string[]) {
  return {
    username: cell(row, 0).trim(),
    password: cell(row, 1).trim(),
    display_name: cell(row, 2).trim(),
    is_enabled: cell(row, 3).toUpperCase() !== "FALSE",
    updated_at: cell(row, 4),
  } satisfies ManagedAdminAccount;
}

function bootstrapAdminAccount() {
  const username = (
    process.env.ADMIN_BOOTSTRAP_USER ||
    process.env.ADMIN_USER ||
    ""
  ).trim();
  const password = (
    process.env.ADMIN_BOOTSTRAP_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    ""
  ).trim();

  if (!username || !password) {
    return null;
  }

  return {
    username,
    password,
    display_name: process.env.ADMIN_BOOTSTRAP_DISPLAY_NAME?.trim() || username,
    is_enabled: true,
    updated_at: formatDateTime(),
  } satisfies ManagedAdminAccount;
}

async function seedAdminAccountsIfEmpty() {
  const rows = await readRows(adminAccountSheetName, adminAccountHeaders);
  if (rows.slice(1).some((row) => cell(row, 0))) {
    return rows;
  }

  const account = bootstrapAdminAccount();
  if (!account) {
    return rows;
  }

  await appendRow(
    adminAccountSheetName,
    adminAccountHeaders,
    adminAccountToRow(account),
  );

  return readRows(adminAccountSheetName, adminAccountHeaders);
}

export async function ensureAdminAccountsSheet() {
  await seedAdminAccountsIfEmpty();
}

export async function authenticateAdminAccount(
  username: string,
  password: string,
) {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedUsername || !normalizedPassword) {
    return { status: "invalid" as const };
  }

  const rows = await seedAdminAccountsIfEmpty();
  const accounts = rows
    .slice(1)
    .map(rowToAdminAccount)
    .filter((account) => account.username);

  if (!accounts.some((account) => account.is_enabled)) {
    return { status: "empty" as const };
  }

  const account = accounts.find(
    (item) =>
      item.is_enabled &&
      item.username.toLowerCase() === normalizedUsername &&
      item.password === normalizedPassword,
  );

  if (!account) {
    return { status: "invalid" as const };
  }

  return {
    status: "ok" as const,
    username: account.username,
    displayName: account.display_name,
  };
}

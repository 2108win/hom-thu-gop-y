import "server-only";

import { formatDateTime, type ManagedListener } from "@/lib/data-models";
import { categories, listenerUsers } from "@/lib/site-data";
import { appendRow, cell, deleteRow, readRows, updateRow } from "./client";
import { listenerHeaders, listenerSheetName } from "./schemas";

function listenerToRow(listener: ManagedListener) {
  return [
    listener.id,
    listener.fullname,
    listener.rank,
    listener.position,
    listener.phone,
    String(listener.order),
    listener.assigned_categories.join(","),
    listener.is_enabled ? "TRUE" : "FALSE",
    listener.created_at,
    listener.updated_at,
  ];
}

function rowToListener(row: string[]) {
  return {
    id: cell(row, 0),
    fullname: cell(row, 1),
    rank: cell(row, 2),
    position: cell(row, 3),
    phone: cell(row, 4),
    order: Number(cell(row, 5)) || 0,
    assigned_categories: cell(row, 6)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    is_enabled: cell(row, 7).toUpperCase() !== "FALSE",
    created_at: cell(row, 8),
    updated_at: cell(row, 9),
  } satisfies ManagedListener;
}

function defaultListeners() {
  const now = formatDateTime();

  return Object.values(listenerUsers).map((listener) => ({
    ...listener,
    assigned_categories: categories
      .filter((category) => category.assigned.includes(listener.id))
      .map((category) => category.id),
    is_enabled: true,
    created_at: now,
    updated_at: now,
  })) satisfies ManagedListener[];
}

async function seedListenersIfEmpty() {
  const rows = await readRows(listenerSheetName, listenerHeaders);
  if (rows.slice(1).some((row) => cell(row, 0))) {
    return rows;
  }

  for (const listener of defaultListeners()) {
    await appendRow(
      listenerSheetName,
      listenerHeaders,
      listenerToRow(listener),
    );
  }

  return readRows(listenerSheetName, listenerHeaders);
}

export async function getManagedListeners() {
  const rows = await seedListenersIfEmpty();
  return rows
    .slice(1)
    .filter((row) => cell(row, 0))
    .map(rowToListener)
    .sort((a, b) => a.order - b.order);
}

export async function appendManagedListener(listener: ManagedListener) {
  await appendRow(listenerSheetName, listenerHeaders, listenerToRow(listener));
}

export async function patchManagedListener(
  id: string,
  patch: Partial<ManagedListener>,
) {
  const rows = await seedListenersIfEmpty();
  const rowIndex = rows.slice(1).findIndex((row) => cell(row, 0) === id);

  if (rowIndex === -1) {
    return null;
  }

  const rowNumber = rowIndex + 2;
  const updated = {
    ...rowToListener(rows[rowNumber - 1]),
    updated_at: formatDateTime(),
    ...patch,
  };

  await updateRow(
    listenerSheetName,
    listenerHeaders,
    rowNumber,
    listenerToRow(updated),
  );

  return updated;
}

export async function removeManagedListener(id: string) {
  const rows = await seedListenersIfEmpty();
  const rowIndex = rows.slice(1).findIndex((row) => cell(row, 0) === id);

  if (rowIndex === -1) {
    return false;
  }

  await deleteRow(listenerSheetName, rowIndex + 2);
  return true;
}

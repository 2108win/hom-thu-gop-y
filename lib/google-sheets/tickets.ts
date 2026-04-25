import "server-only";

import { normalizeTicketCode, type StoredTicket } from "@/lib/data-models";
import { appendRow, cell, deleteRow, readRows, updateRow } from "./client";
import { feedbackSheetName, ticketHeaders } from "./schemas";
import { createLookupCode } from "@/lib/server-codes";

function ticketToRow(ticket: StoredTicket) {
  return [
    ticket.ticket_code,
    ticket.created_at,
    ticket.status,
    ticket.category_id,
    ticket.category,
    ticket.is_anonymous ? "TRUE" : "FALSE",
    ticket.name ?? "",
    ticket.unit ?? "",
    ticket.message,
    ticket.admin_reply ?? "",
    ticket.replied_by ?? "",
    ticket.replied_at ?? "",
    ticket.bot_reply,
  ];
}

function rowToTicket(row: string[]) {
  return {
    ticket_code: cell(row, 0),
    created_at: cell(row, 1),
    status: cell(row, 2) === "done" ? "done" : "pending",
    category_id: cell(row, 3),
    category: cell(row, 4),
    is_anonymous: cell(row, 5).toUpperCase() === "TRUE",
    name: cell(row, 6),
    unit: cell(row, 7),
    message: cell(row, 8),
    admin_reply: cell(row, 9),
    replied_by: cell(row, 10),
    replied_at: cell(row, 11),
    bot_reply: cell(row, 12),
  } satisfies StoredTicket;
}

export async function getTickets() {
  const rows = await readRows(feedbackSheetName, ticketHeaders);
  return rows
    .slice(1)
    .filter((row) => cell(row, 0))
    .map(rowToTicket)
    .reverse();
}

export async function appendTicket(ticket: StoredTicket) {
  await appendRow(feedbackSheetName, ticketHeaders, ticketToRow(ticket));
}

export async function findTicket(ticketCode: string) {
  const normalized = normalizeTicketCode(ticketCode);
  const rows = await readRows(feedbackSheetName, ticketHeaders);
  const row = rows
    .slice(1)
    .find((item) => normalizeTicketCode(cell(item, 0)) === normalized);

  return row ? rowToTicket(row) : null;
}

export async function createUniqueTicketCode() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = createLookupCode("GP");
    if (!(await findTicket(code))) {
      return code;
    }
  }

  throw new Error("Không thể tạo mã phiếu duy nhất. Vui lòng thử lại.");
}

export async function patchTicket(
  ticketCode: string,
  patch: Partial<StoredTicket>,
) {
  const normalized = normalizeTicketCode(ticketCode);
  const rows = await readRows(feedbackSheetName, ticketHeaders);
  const rowIndex = rows
    .slice(1)
    .findIndex((row) => normalizeTicketCode(cell(row, 0)) === normalized);

  if (rowIndex === -1) {
    return null;
  }

  const rowNumber = rowIndex + 2;
  const updated = {
    ...rowToTicket(rows[rowNumber - 1]),
    ...patch,
  };

  await updateRow(
    feedbackSheetName,
    ticketHeaders,
    rowNumber,
    ticketToRow(updated),
  );

  return updated;
}

export async function removeTicket(ticketCode: string) {
  const normalized = normalizeTicketCode(ticketCode);
  const rows = await readRows(feedbackSheetName, ticketHeaders);
  const rowIndex = rows
    .slice(1)
    .findIndex((row) => normalizeTicketCode(cell(row, 0)) === normalized);

  if (rowIndex === -1) {
    return false;
  }

  await deleteRow(feedbackSheetName, rowIndex + 2);
  return true;
}

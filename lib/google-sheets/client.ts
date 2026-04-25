import "server-only";

import { createSign } from "node:crypto";

type SheetsValueRange = {
  values?: string[][];
};

type SpreadsheetMetadata = {
  sheets?: Array<{
    properties?: {
      sheetId?: number;
      title?: string;
    };
  }>;
};

type ServiceAccountCredentials = {
  clientEmail: string;
  privateKey: string;
};

const sheetsScope = "https://www.googleapis.com/auth/spreadsheets";
const oauthTokenUrl = "https://oauth2.googleapis.com/token";

let accessTokenCache: { token: string; expiresAt: number } | null = null;
const ensuredSheets = new Set<string>();

export class SheetsConfigError extends Error {
  constructor(message = "Chưa cấu hình Google Sheets.") {
    super(message);
    this.name = "SheetsConfigError";
  }
}

export function isSheetsConfigError(error: unknown) {
  return error instanceof SheetsConfigError;
}

function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  if (!spreadsheetId) {
    throw new SheetsConfigError(
      "Thiếu GOOGLE_SHEETS_SPREADSHEET_ID trong biến môi trường.",
    );
  }

  return spreadsheetId;
}

function getCredentials(): ServiceAccountCredentials {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as {
        client_email?: string;
        private_key?: string;
      };

      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch {
      throw new SheetsConfigError(
        "GOOGLE_SERVICE_ACCOUNT_JSON không phải JSON hợp lệ.",
      );
    }
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new SheetsConfigError(
      "Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_PRIVATE_KEY hoặc GOOGLE_SERVICE_ACCOUNT_JSON.",
    );
  }

  return { clientEmail, privateKey };
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken() {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) {
    return accessTokenCache.token;
  }

  const { clientEmail, privateKey } = getCredentials();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: sheetsScope,
    aud: oauthTokenUrl,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(claims),
  )}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;

  const response = await fetch(oauthTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Không lấy được access token Google: ${message}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

async function sheetsFetch<T>(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  const spreadsheetId = getSpreadsheetId();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    },
  );

  if (!response.ok) {
    const message = await response.text();
    if (response.status === 403) {
      throw new Error(
        "Google Sheets từ chối quyền truy cập. Hãy share file Sheet cho GOOGLE_SERVICE_ACCOUNT_EMAIL với quyền Editor.",
      );
    }
    if (response.status === 404) {
      throw new Error(
        "Không tìm thấy Google Sheet. Hãy kiểm tra GOOGLE_SHEETS_SPREADSHEET_ID.",
      );
    }
    throw new Error(`Google Sheets API lỗi ${response.status}: ${message}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function valuesPath(range: string, suffix = "") {
  return `/values/${encodeURIComponent(range)}${suffix}`;
}

async function getSpreadsheetMetadata() {
  return sheetsFetch<SpreadsheetMetadata>(
    "?fields=sheets.properties(sheetId,title)",
  );
}

async function getSheetId(sheetName: string) {
  const metadata = await getSpreadsheetMetadata();
  const sheet = metadata.sheets?.find(
    (item) => item.properties?.title === sheetName,
  );

  return sheet?.properties?.sheetId ?? null;
}

async function addSheet(sheetName: string) {
  await sheetsFetch(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        },
      ],
    }),
  });
}

async function setHeaderRow(sheetName: string, headers: string[]) {
  await sheetsFetch(
    valuesPath(
      `${sheetName}!A1:${columnName(headers.length)}1`,
      "?valueInputOption=RAW",
    ),
    {
      method: "PUT",
      body: JSON.stringify({
        values: [headers],
      }),
    },
  );
}

async function ensureSheet(sheetName: string, headers: string[]) {
  if (ensuredSheets.has(sheetName)) {
    return;
  }

  const sheetId = await getSheetId(sheetName);
  if (sheetId === null) {
    await addSheet(sheetName);
  }

  const headerRange = await sheetsFetch<SheetsValueRange>(
    valuesPath(`${sheetName}!1:1`),
  );
  if (!headerRange.values?.[0]?.length) {
    await setHeaderRow(sheetName, headers);
  }

  ensuredSheets.add(sheetName);
}

export async function readRows(sheetName: string, headers: string[]) {
  await ensureSheet(sheetName, headers);
  const range = `${sheetName}!A:${columnName(headers.length)}`;
  const data = await sheetsFetch<SheetsValueRange>(valuesPath(range));
  return data.values ?? [];
}

export async function appendRow(
  sheetName: string,
  headers: string[],
  row: string[],
) {
  await ensureSheet(sheetName, headers);
  await sheetsFetch(
    valuesPath(
      `${sheetName}!A:${columnName(headers.length)}`,
      ":append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS",
    ),
    {
      method: "POST",
      body: JSON.stringify({
        values: [row],
      }),
    },
  );
}

export async function updateRow(
  sheetName: string,
  headers: string[],
  rowNumber: number,
  row: string[],
) {
  await sheetsFetch(
    valuesPath(
      `${sheetName}!A${rowNumber}:${columnName(headers.length)}${rowNumber}`,
      "?valueInputOption=USER_ENTERED",
    ),
    {
      method: "PUT",
      body: JSON.stringify({
        values: [row],
      }),
    },
  );
}

export async function deleteRow(sheetName: string, rowNumber: number) {
  const sheetId = await getSheetId(sheetName);
  if (sheetId === null) {
    return;
  }

  await sheetsFetch(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    }),
  });
}

export function columnName(index: number) {
  let value = index;
  let output = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    output = String.fromCharCode(65 + remainder) + output;
    value = Math.floor((value - 1) / 26);
  }

  return output;
}

export function cell(row: string[], index: number) {
  return row[index] ?? "";
}

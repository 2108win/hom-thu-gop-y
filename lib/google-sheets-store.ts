import "server-only";

export {
  SheetsConfigError,
  isSheetsConfigError,
} from "@/lib/google-sheets/client";
export { adminAccountSheetName } from "@/lib/google-sheets/schemas";
export {
  authenticateAdminAccount,
  ensureAdminAccountsSheet,
} from "@/lib/google-sheets/admin-accounts";
export {
  appendManagedListener,
  getManagedListeners,
  patchManagedListener,
  removeManagedListener,
} from "@/lib/google-sheets/listeners";
export {
  appendManagedSurvey,
  findManagedSurvey,
  getManagedSurveys,
  getOpenManagedSurveys,
  patchManagedSurvey,
  removeManagedSurvey,
} from "@/lib/google-sheets/managed-surveys";
export {
  appendSurveyResponse,
  createUniqueSurveyResponseCode,
  getSurveyResponses,
  removeSurveyResponse,
} from "@/lib/google-sheets/survey-responses";
export {
  appendTicket,
  createUniqueTicketCode,
  findTicket,
  getTickets,
  patchTicket,
  removeTicket,
} from "@/lib/google-sheets/tickets";

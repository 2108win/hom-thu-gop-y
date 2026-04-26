import "server-only";

import * as supabaseStore from "@/lib/supabase-store";

export const adminAccountStoreName = supabaseStore.adminAccountTableName;
export const storageProvider = "Supabase";

export const isStoreConfigError = (error: unknown) =>
  supabaseStore.isSupabaseConfigError(error);

export const authenticateAdminAccount = supabaseStore.authenticateAdminAccount;

export const getTickets = supabaseStore.getTickets;
export const appendTicket = supabaseStore.appendTicket;
export const findTicket = supabaseStore.findTicket;
export const createUniqueTicketCode = supabaseStore.createUniqueTicketCode;
export const patchTicket = supabaseStore.patchTicket;
export const removeTicket = supabaseStore.removeTicket;

export const getManagedSurveys = supabaseStore.getManagedSurveys;
export const getOpenManagedSurveys = supabaseStore.getOpenManagedSurveys;
export const appendManagedSurvey = supabaseStore.appendManagedSurvey;
export const findManagedSurvey = supabaseStore.findManagedSurvey;
export const patchManagedSurvey = supabaseStore.patchManagedSurvey;
export const removeManagedSurvey = supabaseStore.removeManagedSurvey;

export const getSurveyResponses = supabaseStore.getSurveyResponses;
export const appendSurveyResponse = supabaseStore.appendSurveyResponse;
export const createUniqueSurveyResponseCode =
  supabaseStore.createUniqueSurveyResponseCode;
export const removeSurveyResponse = supabaseStore.removeSurveyResponse;

export const getManagedListeners = supabaseStore.getManagedListeners;
export const appendManagedListener = supabaseStore.appendManagedListener;
export const patchManagedListener = supabaseStore.patchManagedListener;
export const removeManagedListener = supabaseStore.removeManagedListener;

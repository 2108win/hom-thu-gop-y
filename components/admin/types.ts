import type {
  ManagedListener,
  ManagedSurvey,
  StoredTicket,
  TicketStatus,
} from "@/lib/data-models";

export type AdminTab = "tickets" | "surveys" | "listeners" | "account";
export type StatusFilter = "all" | TicketStatus;

export type AdminProfile = {
  username: string;
  displayName: string;
  role: "admin" | "listener";
  listenerId: string;
  assignedCategoryIds: string[];
  email: string;
  phone: string;
  rank: string;
  position: string;
  unit: string;
};

export type SurveyDraft = {
  title: string;
  description: string;
  target_url: string;
  start_date: string;
  end_date: string;
  is_enabled: boolean;
};

export type ListenerDraft = {
  fullname: string;
  rank: string;
  position: string;
  phone: string;
  order: number;
  assigned_categories: string[];
  is_enabled: boolean;
};

export type DeleteConfirm =
  | { kind: "ticket"; id: string; title: string }
  | { kind: "survey"; id: string; title: string }
  | { kind: "listener"; id: string; title: string };

export type IsActionPending = (key: string) => boolean;

export type TicketPatch = Partial<StoredTicket>;
export type SurveyPatch = Partial<ManagedSurvey>;
export type ListenerPatch = Partial<ManagedListener>;

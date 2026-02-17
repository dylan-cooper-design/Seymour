export type MessageRole = "user" | "assistant";

export type MessageState = "streaming" | "complete" | "error" | "cancelled";

export type ThreadMessage = {
  id: string;
  role: MessageRole;
  text: string;
  state?: MessageState;
  timestamp?: number;
};

export type MilestoneStatus =
  | "complete-decision"
  | "incomplete-decision"
  | "incomplete-action";

export interface Goal {
  id: string;
  text: string;
  createdAt: string;
}

export interface Decision {
  id: string;
  milestoneId: string;
  title: string;
  actionItem: string;
  status: "todo" | "done";
}

export type NavItem = {
  id: string;
  label: string;
  status: MilestoneStatus;
  objective?: string;
  decisions?: Decision[];
};

export type NavGroup = {
  id: string;
  label: string;
  isExpanded: boolean;
  items: NavItem[];
  isDimmed?: boolean;
};

export type NavModel = {
  projectName: string;
  foundationLabel: string;
  groups: NavGroup[];
};

export type ThreadsByNavItemId = Record<string, ThreadMessage[]>;

export type NavPatch = {
  setProjectName?: string;
  addMilestones?: Array<{
    id?: string;
    groupId: string;
    label: string;
    status?: MilestoneStatus;
    objective?: string;
    decisions?: Decision[];
  }>;
  setActiveNavItemId?: string;
  clearAllItemsBeforeAdd?: boolean;
};

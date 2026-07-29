export type MessageRole = "user" | "assistant";

export type MessageState = "streaming" | "complete" | "error" | "cancelled";

export type ThreadMessage = {
  id: string;
  role: MessageRole;
  text: string;
  state?: MessageState;
  timestamp?: number;
};

export type MilestoneStatus = "complete-decision" | "incomplete-decision" | "incomplete-action";

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
  detail?: ItemDetail;
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
  foundationDetail?: ItemDetail;
};

export type PlatformItem = {
  id: string;
  label: string;
};

export type MilestoneChild = {
  id: string;
  label: string;
  status?: MilestoneStatus;
  decisions?: Decision[];
};

export type Milestone = {
  id: string;
  label: string;
  isDimmed?: boolean;
  isExpanded?: boolean;
  children: MilestoneChild[];
};

export type SidebarNavData = {
  projectName: string;
  platform: PlatformItem[];
  milestones: Milestone[];
};

export type DetailSection = {
  label: string;
  content: string | string[];
};

export type ItemDetail = {
  sections: DetailSection[];
};

export type ThreadsByNavItemId = Record<string, ThreadMessage[]>;

/**
 * Chat threads keyed by node id. Only workstream nodes own a thread, so this is
 * 1:1 with the workstreams in the project tree.
 */
export type ThreadsByNodeId = Record<string, ThreadMessage[]>;

export type NavPatch = {
  setProjectName?: string;
  setGroups?: Array<{
    id: string;
    label: string;
    isExpanded?: boolean;
    isDimmed?: boolean;
    items: Array<{
      id?: string;
      label: string;
      status?: MilestoneStatus;
      objective?: string;
      decisions?: Decision[];
      detail?: ItemDetail;
    }>;
  }>;
  addMilestones?: Array<{
    id?: string;
    groupId: string;
    label: string;
    status?: MilestoneStatus;
    objective?: string;
    decisions?: Decision[];
  }>;
  updateItems?: Array<{
    id: string;
    status?: MilestoneStatus;
    detail?: ItemDetail;
    objective?: string;
    decisions?: Decision[];
  }>;
  setFoundationDetail?: ItemDetail;
  setActiveNavItemId?: string;
  clearAllItemsBeforeAdd?: boolean;
};

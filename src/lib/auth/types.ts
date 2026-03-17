export type Resource =
  | "dashboard"
  | "members"
  | "salaries"
  | "customers"
  | "products"
  | "contracts"
  | "commissions"
  | "settings"
  | "teams"
  | "roles"
  | "invitations";

export type Action = "view" | "create" | "edit" | "delete";

export type Scope = "all" | "own" | "team";

export type Permission = {
  resource: Resource;
  action: Action;
  scope: Scope;
};

export type AuthContext = {
  userId: string;
  memberId: string;
  memberName: string;
  roleId: string;
  roleName: string;
  teamId: string | null;
  permissions: Permission[];
};

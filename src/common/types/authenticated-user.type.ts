export type AuthenticatedUser = {
  userId: string;
  organizationId: string;
  role: 'org_admin' | 'member';
};
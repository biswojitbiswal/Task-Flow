import { z } from 'zod';

export const organizationMemberParamsSchema = z.object({
  organizationId: z.uuid(),
});

export const memberParamsSchema = z.object({
  organizationId: z.uuid(),
  userId: z.uuid(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['org_admin', 'member']),
});

export const memberQuerySchema = z.object({
  page: z.coerce
  .number()
  .int()
  .min(1)
  .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  search: z
    .string()
    .trim()
    .min(1)
    .optional(),
});

export type OrganizationMemberParamsDto =
  z.infer<typeof organizationMemberParamsSchema>;

export type MemberParamsDto =
  z.infer<typeof memberParamsSchema>;

export type UpdateMemberRoleDto =
  z.infer<typeof updateMemberRoleSchema>;

export type MemberQueryDto =
  z.infer<typeof memberQuerySchema>;
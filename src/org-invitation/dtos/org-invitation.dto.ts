import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.email(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

export type CreateInvitationDto =
  z.infer<typeof createInvitationSchema>;

export type AcceptInvitationDto =
  z.infer<typeof acceptInvitationSchema>;
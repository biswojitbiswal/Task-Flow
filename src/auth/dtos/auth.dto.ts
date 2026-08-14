import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
  organizationName: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});


export const selectOrganizationSchema = z.object({
  organizationId: z.uuid(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});


export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type SelectOrganizationDto = z.infer<typeof selectOrganizationSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

import { z } from 'zod';

export const CreateProjectDto = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Project name is required')
        .max(100, 'Project name must not exceed 100 characters'),

    description: z
        .string()
        .trim()
        .max(1000, 'Description must not exceed 1000 characters')
        .optional(),
});

export const UpdateProjectDto = z.object({
        name: z
            .string()
            .trim()
            .min(1, 'Project name cannot be empty')
            .max(100, 'Project name must not exceed 100 characters')
            .optional(),

        description: z
            .string()
            .trim()
            .max(1000, 'Description must not exceed 1000 characters')
            .optional(),
}).refine(
        (data) => data.name !== undefined || data.description !== undefined,
        {
            message: 'At least one field is required',
        },
);


export const FindProjectsDto = z.object({
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
    .max(100, 'Search must not exceed 100 characters')
    .optional(),
});



export type CreateProjectDto = z.infer<typeof CreateProjectDto>;
export type UpdateProjectDto = z.infer<typeof UpdateProjectDto>;
export type FindProjectsDto = z.infer<typeof FindProjectsDto>;

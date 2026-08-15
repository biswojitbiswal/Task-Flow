import { z } from 'zod';

export const CreateCommentDto = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment content is required')
    .max(
      2000,
      'Comment cannot exceed 2000 characters',
    ),
});

export type CreateCommentDtoType = z.infer<
  typeof CreateCommentDto
>;

export const UpdateCommentDto = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment content is required')
    .max(
      2000,
      'Comment cannot exceed 2000 characters',
    ),
});

export type UpdateCommentDtoType = z.infer<
  typeof UpdateCommentDto
>;
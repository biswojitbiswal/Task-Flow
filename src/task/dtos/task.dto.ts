import { z } from 'zod';

export const CreateTaskDto = z.object({
    projectId: z
        .string()
        .uuid('Invalid project ID'),

    title: z
        .string()
        .trim()
        .min(1, 'Task title is required')
        .max(200, 'Task title must not exceed 200 characters'),

    description: z
        .string()
        .trim()
        .max(2000, 'Description must not exceed 2000 characters')
        .optional(),

    status: z
        .enum([
            'todo',
            'in_progress',
            'review',
            'done',
        ])
        .default('todo'),

    priority: z
        .enum([
            'low',
            'medium',
            'high',
            'urgent',
        ])
        .default('medium'),

    dueAt: z
        .string()
        .datetime()
        .optional(),
});

export const UpdateTaskDto = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, 'Task title cannot be empty')
            .max(200, 'Task title must not exceed 200 characters')
            .optional(),

        description: z
            .string()
            .trim()
            .max(2000, 'Description must not exceed 2000 characters')
            .optional(),

        status: z
            .enum([
                'todo',
                'in_progress',
                'review',
                'done',
            ])
            .optional(),

        priority: z
            .enum([
                'low',
                'medium',
                'high',
                'urgent',
            ])
            .optional(),

        dueAt: z
            .string()
            .datetime()
            .optional(),
    })
    .refine(
        (data) =>
            data.title !== undefined ||
            data.description !== undefined ||
            data.status !== undefined ||
            data.priority !== undefined ||
            data.dueAt !== undefined,
        {
            message: 'At least one field is required',
        },
    );

    
export const FindTasksDto = z
    .object({
        page: z.preprocess(
            (value) => value === '' ? undefined : value,
            z.coerce.number().int().min(1).default(1),
        ),

        limit: z.preprocess(
            (value) => value === '' ? undefined : value,
            z.coerce.number().int().min(1).max(100).default(20),
        ),

        search: z.preprocess(
            (value) => value === '' ? undefined : value,
            z.string().trim().max(100).optional(),
        ),

        status: z.preprocess(
            (value) => value === '' ? undefined : value,
            z.enum([
                'todo',
                'in_progress',
                'review',
                'done',
            ]).optional(),
        ),

        priority: z.preprocess(
            (value) => value === '' ? undefined : value,
            z.enum([
                'low',
                'medium',
                'high',
                'urgent',
            ]).optional(),
        ),

        assigneeId: z.preprocess(
            (value) => value === '' ? undefined : value,
            z.string().uuid('Invalid assignee ID').optional(),
        ),

        dueFrom: z.preprocess(
            (value) => value === '' ? undefined : value,
            z.string().datetime().optional(),
        ),

        dueTo: z.preprocess(
            (value) => value === '' ? undefined : value,
            z.string().datetime().optional(),
        ),
    })
    .refine(
        (data) =>
            (data.dueFrom === undefined &&
                data.dueTo === undefined) ||
            (data.dueFrom !== undefined &&
                data.dueTo !== undefined),
        {
            message: 'dueFrom and dueTo must be provided together',
            path: ['dueFrom'],
        },
    );

export const AssignTaskDto = z.object({
    userId: z
        .string()
        .uuid('Invalid user ID'),
});


export const BulkTaskStatusUpdateDto = z.object({
    taskIds: z
        .array(
            z.string().uuid('Invalid task ID'),
        )
        .min(1, 'At least one task ID is required'),

    status: z.enum([
        'todo',
        'in_progress',
        'review',
        'done',
    ]),
});



export type BulkTaskStatusUpdateDto = z.infer<
    typeof BulkTaskStatusUpdateDto
>;

export type CreateTaskDto = z.infer<typeof CreateTaskDto>;

export type UpdateTaskDto = z.infer<typeof UpdateTaskDto>;

export type FindTasksDto = z.infer<typeof FindTasksDto>;

export type AssignTaskDto = z.infer<typeof AssignTaskDto>;
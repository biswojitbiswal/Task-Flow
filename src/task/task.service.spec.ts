import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { TaskService } from './task.service';
import { TaskRepository } from './task.repository';
import { JobsService } from 'src/jobs/jobs.service';

describe('TaskService', () => {
    let taskService: TaskService;

    const mockTaskRepository = {
        findOne: jest.fn(),
        findUserByOrganization: jest.fn(),
        findAssignment: jest.fn(),
        assignUser: jest.fn(),
    };

    const mockJobsService = {
        addTaskAssignmentEmailJob: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule =
            await Test.createTestingModule({
                providers: [
                    TaskService,

                    {
                        provide: TaskRepository,
                        useValue: mockTaskRepository,
                    },

                    {
                        provide: JobsService,
                        useValue: mockJobsService,
                    },
                ],
            }).compile();

        taskService =
            module.get<TaskService>(TaskService);
    });

    describe('assign', () => {
        it('should assign a user successfully and queue email notification', async () => {
            mockTaskRepository.findOne.mockResolvedValue({
                id: 'task-1',
                title: 'Build API',
            });

            mockTaskRepository.findUserByOrganization.mockResolvedValue({
                id: 'user-2',
                email: 'bob@taskflow-demo.com',
            });

            mockTaskRepository.findAssignment.mockResolvedValue(
                null,
            );

            mockTaskRepository.assignUser.mockResolvedValue({
                id: 'assignment-1',
                taskId: 'task-1',
                userId: 'user-2',
            });

            mockJobsService.addTaskAssignmentEmailJob.mockResolvedValue({
                jobId: 'job-1',
            });

            const result = await taskService.assign(
                'org-1',
                'task-1',
                {
                    userId: 'user-2',
                },
            );

            expect(result).toEqual({
                assignment: {
                    id: 'assignment-1',
                    taskId: 'task-1',
                    userId: 'user-2',
                },
                jobId: 'job-1',
            });

            expect(
                mockTaskRepository.findUserByOrganization,
            ).toHaveBeenCalledWith(
                'user-2',
                'org-1',
            );

            expect(
                mockTaskRepository.findAssignment,
            ).toHaveBeenCalledWith(
                'task-1',
                'user-2',
            );

            expect(
                mockTaskRepository.assignUser,
            ).toHaveBeenCalledWith(
                'task-1',
                'user-2',
            );

            expect(
                mockJobsService.addTaskAssignmentEmailJob,
            ).toHaveBeenCalledWith({
                taskId: 'task-1',
                assignedUserId: 'user-2',
                email: 'bob@taskflow-demo.com',
                taskTitle: 'Build API',
            });
        });

        it('should throw NotFoundException when user does not belong to organization', async () => {
            mockTaskRepository.findOne.mockResolvedValue({
                id: 'task-1',
                title: 'Build API',
            });

            mockTaskRepository.findUserByOrganization.mockResolvedValue(
                null,
            );

            try {
                await taskService.assign(
                    'org-1',
                    'task-1',
                    {
                        userId: 'user-2',
                    },
                );

                fail('Expected NotFoundException');
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException);

                expect(error.getStatus()).toBe(404);

                expect(error.getResponse()).toEqual({
                    error: 'User does not belong to the organization',
                    code: 'USER_NOT_IN_ORGANIZATION',
                    details: {},
                });
            }

            expect(
                mockTaskRepository.findUserByOrganization,
            ).toHaveBeenCalledWith(
                'user-2',
                'org-1',
            );

            expect(
                mockTaskRepository.findAssignment,
            ).not.toHaveBeenCalled();

            expect(
                mockTaskRepository.assignUser,
            ).not.toHaveBeenCalled();

            expect(
                mockJobsService.addTaskAssignmentEmailJob,
            ).not.toHaveBeenCalled();
        });

        it('should throw ConflictException when user is already assigned to task', async () => {
            mockTaskRepository.findOne.mockResolvedValue({
                id: 'task-1',
                title: 'Build API',
            });

            mockTaskRepository.findUserByOrganization.mockResolvedValue({
                id: 'user-2',
                email: 'bob@taskflow-demo.com',
            });

            mockTaskRepository.findAssignment.mockResolvedValue({
                id: 'assignment-1',
                taskId: 'task-1',
                userId: 'user-2',
            });

            try {
                await taskService.assign(
                    'org-1',
                    'task-1',
                    {
                        userId: 'user-2',
                    },
                );

                fail('Expected ConflictException');
            } catch (error) {
                expect(error).toBeInstanceOf(ConflictException);

                expect(error.getStatus()).toBe(409);

                expect(error.getResponse()).toEqual({
                    error: 'User is already assigned to this task',
                    code: 'TASK_ALREADY_ASSIGNED',
                    details: {},
                });
            }

            expect(
                mockTaskRepository.findAssignment,
            ).toHaveBeenCalledWith(
                'task-1',
                'user-2',
            );

            expect(
                mockTaskRepository.assignUser,
            ).not.toHaveBeenCalled();

            expect(
                mockJobsService.addTaskAssignmentEmailJob,
            ).not.toHaveBeenCalled();
        });

    });

});
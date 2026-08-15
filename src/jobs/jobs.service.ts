import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class JobsService {
    constructor(
        @InjectQueue('email-notifications')
        private readonly emailQueue: Queue,

        @InjectQueue('email-notifications-dlq')
        private readonly dlq: Queue,

        private readonly redisService: RedisService
    ) { }


    async addTaskAssignmentEmailJob(data: {
        taskId: string;
        assignedUserId: string;
        email: string;
        taskTitle: string;
    }) {
        const dedupeKey = `task-assignment-email:dedupe:` + `${data.taskId}:${data.assignedUserId}`;

        const result =
            await this.redisService.setIfNotExists(
                dedupeKey,
                '1',
                5,
            );

        if (result !== 'OK') {
            return {
                jobId: null,
                deduplicated: true,
            };
        }

        const job = await this.emailQueue.add(
            'task-assigned-email',
            {
                taskId: data.taskId,
                assignedUserId: data.assignedUserId,
                email: data.email,
                taskTitle: data.taskTitle,
            },
        );

        return {
            jobId: job.id,
            deduplicated: false
        };
    }


    async addTestJob() {
        const job = await this.emailQueue.add(
            'test-email',
            {
                message: 'Hello from TaskFlow',
            },
        );

        return {
            jobId: job.id,
        };
    }


    async clearTestQueue() {
        await this.emailQueue.obliterate({
            force: true,
        });

        return {
            message: 'Test queue cleared',
        };
    }


    async getDeadLetterJobs() {
        return this.dlq.getJobs(
            ['waiting', 'active', 'completed', 'failed'],
            0,
            100,
        );
    }


    async getJobStatus(jobId: string) {
        const job = await this.emailQueue.getJob(jobId);

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        const state = await job.getState();

        let status:
            | 'pending'
            | 'active'
            | 'completed'
            | 'failed';

        switch (state) {
            case 'waiting':
            case 'delayed':
            case 'prioritized':
                status = 'pending';
                break;

            case 'active':
                status = 'active';
                break;

            case 'completed':
                status = 'completed';
                break;

            case 'failed':
                status = 'failed';
                break;

            default:
                status = 'pending';
        }

        return {
            jobId: job.id,
            status,
        };
    }


    async addRateLimitTestJobs() {
        const jobs = Array.from(
            { length: 100 },
            (_, index) => ({
                name: 'task-assigned-email',
                data: {
                    taskId: `rate-test-${index}`,
                    assignedUserId: `user-${index}`,
                    email: `test${index}@example.com`,
                    taskTitle: `Rate limit test ${index}`,
                },
            }),
        );

        const result =
            await this.emailQueue.addBulk(jobs);

        return {
            count: result.length,
        };
    }
}
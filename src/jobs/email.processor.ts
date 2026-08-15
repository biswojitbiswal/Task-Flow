import { Injectable } from '@nestjs/common';
import {
    OnWorkerEvent,
    Processor,
    WorkerHost,
} from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';

@Processor('email-notifications', {
    limiter: {
        max: 50,
        duration: 60_000
    }
})
@Injectable()
export class EmailProcessor extends WorkerHost {
    constructor(
        @InjectQueue('email-notifications-dlq')
        private readonly dlq: Queue,
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        console.log(`[Worker] Processing job ${job.id}`);
        console.log(`[Worker] Job name: ${job.name}`);
        console.log(`[Worker] Job data:`, job.data);

        switch (job.name) {
            case 'test-email':
                await this.sendTestEmail(job);
                break;

            case 'task-assigned-email':
                await this.sendTaskAssignmentEmail(job);
                break;

            default:
                throw new Error(
                    `Unsupported job type: ${job.name}`,
                );
        }
    }


    private async sendTestEmail(
        job: Job,
    ): Promise<void> {
        console.log(
            `[Email] Sending test email...`,
        );

        console.log(
            `[Email] Message: ${job.data.message}`,
        );

        await new Promise((resolve) =>
            setTimeout(resolve, 1000),
        );

        console.log(
            `[Email] Test email sent successfully`,
        );
    }


    private async sendTaskAssignmentEmail(
        job: Job,
    ): Promise<void> {
        const {
            email,
            taskTitle,
        } = job.data;

        console.log(
            `[Email] Sending task assignment email`,
        );

        console.log(
            `[Email] To: ${email}`,
        );

        console.log(
            `[Email] Task: ${taskTitle}`,
        );

        await new Promise((resolve) =>
            setTimeout(resolve, 1000),
        );

        console.log(
            `[Email] Task assignment email sent successfully`,
        );
    }


    private async sendMockEmail(
        job: Job,
    ): Promise<void> {
        console.log(
            `[Email] Sending mock email...`,
        );

        console.log(
            `[Email] Message: ${job.data.message}`,
        );

        // throw new Error(
        //     'Mock email service failed',
        // );

        // Simulate email processing
        await new Promise((resolve) =>
            setTimeout(resolve, 1000),
        );

        console.log(
            `[Email] Mock email sent successfully`,
        );
    }

    @OnWorkerEvent('active')
    onActive(job: Job) {
        console.log(
            `[Worker] Job ${job.id} is now active`,
        );
        console.log(
            `[Worker] attemptsMade: ${job.attemptsMade}`,
        );
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        console.log(
            `[Worker] Job ${job.id} completed`,
        );
    }

    @OnWorkerEvent('failed')
    async onFailed(
        job: Job | undefined,
        error: Error,
    ) {
        if (!job) {
            return;
        }

        console.error(
            `[Worker] Job ${job.id} failed`,
        );

        console.error(
            `[Worker] attemptsMade: ${job.attemptsMade}`,
        );

        console.error(
            `[Worker] max attempts: ${job.opts.attempts}`,
        );

        console.error(
            `[Worker] Error: ${error.message}`,
        );

        const maxAttempts =
            job.opts.attempts ?? 1;

        if (job.attemptsMade >= maxAttempts) {
            console.error(
                `[Worker] Job ${job.id} permanently failed`,
            );

            await this.moveToDeadLetterQueue(
                job,
                error,
            );
        }
    }

    private async moveToDeadLetterQueue(
        job: Job,
        error: Error,
    ): Promise<void> {
        await this.dlq.add(
            'failed-email',
            {
                originalJobId: job.id,
                originalJobName: job.name,
                originalData: job.data,

                attemptsMade: job.attemptsMade,

                failedReason: error.message,

                failedAt: new Date().toISOString(),
            },
        );

        console.log(
            `[Worker] Job ${job.id} moved to DLQ`,
        );
    }
}
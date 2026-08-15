import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { EmailProcessor } from './email.processor';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [
        RedisModule,
        BullModule.registerQueue({
            name: 'email-notifications',

            defaultJobOptions: {
                attempts: 4,

                backoff: {
                    type: 'exponential',
                    delay: 1000
                },

                removeOnComplete: false,
                removeOnFail: false
            },
        },
            {
                name: 'email-notifications-dlq',
            },
        ),
    ],
    controllers: [JobsController],
    providers: [JobsService, EmailProcessor],
    exports: [JobsService]
})
export class JobsModule { }
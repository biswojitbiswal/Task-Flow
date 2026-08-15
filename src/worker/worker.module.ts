import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { JobsModule } from '../jobs/jobs.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    QueueModule,

    JobsModule,
  ],
})
export class WorkerModule {}
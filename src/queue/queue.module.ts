import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>(
            'REDIS_HOST',
          ),
          port: Number(
            configService.getOrThrow<string>(
              'REDIS_PORT',
            ),
          ),
        },
      }),
    }),
  ],

  exports: [BullModule],
})
export class QueueModule {}
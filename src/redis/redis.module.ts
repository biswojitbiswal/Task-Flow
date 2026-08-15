import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from './redis.constant';

@Module({
    providers: [
        {
            provide: REDIS_CLIENT,

            inject: [ConfigService],

            useFactory: (configService: ConfigService) => {
                return new Redis({
                    host: configService.getOrThrow<string>(
                        'REDIS_HOST',
                    ),
                    port: configService.getOrThrow<number>(
                        'REDIS_PORT',
                    ),
                });
            },
        },
        RedisService,
    ],
    exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule { }
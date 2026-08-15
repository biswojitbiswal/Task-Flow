import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constant';


@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) { }


  async get(key: string) {
    return this.redis.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ) {
    if (ttlSeconds) {
      return this.redis.set(
        key,
        value,
        'EX',
        ttlSeconds,
      );
    }

    return this.redis.set(key, value);
  }


  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ) {
    return this.redis.set(
      key,
      value,
      'EX',
      ttlSeconds,
      'NX',
    );
  }
}
import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserRepository } from './users.repository';


@Module({
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
import { Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskRepository } from "./task.repository";
import { TaskController } from "./task.controller";

@Module({
    controllers: [TaskController],
    providers: [TaskService, TaskRepository]
})
export class TaskModule{}
import { Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskRepository } from "./task.repository";
import { TaskController } from "./task.controller";
import { JobsModule } from "src/jobs/jobs.module";

@Module({
    imports: [JobsModule],
    controllers: [TaskController],
    providers: [TaskService, TaskRepository]
})
export class TaskModule{}
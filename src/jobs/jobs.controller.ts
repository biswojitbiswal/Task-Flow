import { Controller, Get, Param, Post } from '@nestjs/common';

import { JobsService } from './jobs.service';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller({
    path: 'jobs',
    version: '1'
})
export class JobsController {
    constructor(
        private readonly jobsService: JobsService,
    ) { }

    @Post('test')
    async createTestJob() {
        return await this.jobsService.addTestJob();
    }


    @Post('clear')
    async clearTestQueue() {
        return this.jobsService.clearTestQueue();
    }


    @Get('dlq')
    async getDeadLetterJobs() {
        return this.jobsService.getDeadLetterJobs();
    }



    @ApiOperation({
        summary: 'Get background job status',
    })
    @ApiParam({
        name: 'id',
        description: 'BullMQ job ID',
        example: '10',
    })
    @ApiResponse({
        status: 200,
        description: 'Job status retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Job not found',
    })
    @Get(':id')
    async getJobStatus(
        @Param('id') id: string,
    ) {
        return this.jobsService.getJobStatus(id);
    }

    @Post("rate-limit-test")
    async testLimit(){
        return await this.jobsService.addRateLimitTestJobs()
    }
}
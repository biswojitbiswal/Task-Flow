import {
  INestApplication,
  VersioningType,
} from '@nestjs/common';

import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import request from 'supertest';

import { AppModule } from './../src/app.module';

import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');

    app.enableVersioning({
      type: VersioningType.URI,
    });

    app.useGlobalFilters(
      new HttpExceptionFilter(),
    );

    app.useGlobalInterceptors(
      new ResponseInterceptor(),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login a user successfully', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@taskflow-demo.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');

      expect(response.body.data).toHaveProperty(
        'accessToken',
      );

      expect(response.body.data).toHaveProperty(
        'refreshToken',
      );

      expect(response.body.data).toHaveProperty(
        'user',
      );

      expect(response.body.data.user.email).toBe(
        'alice@taskflow-demo.com',
      );
    });
  });

  // Validation Error
  describe('POST /api/v1/auth/login - error scenarios', () => {
    it('should return 401 for invalid credentials', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@taskflow-demo.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid login payload', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });


  describe('POST /api/v1/task - validation errors', () => {
    it('should return 400 when required fields are missing', async () => {
      const loginResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@taskflow-demo.com',
          password: 'Password123!',
        })
        .expect(200);

      const accessToken =
        loginResponse.body.data.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/task')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({})
        .expect(400);
    });
  });


  // Create task
  describe('POST /api/v1/task', () => {
    it('should create a task successfully', async () => {
      // Login
      const loginResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@taskflow-demo.com',
          password: 'Password123!',
        })
        .expect(200);

      const accessToken =
        loginResponse.body.data.accessToken;

      // Create task
      const response = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/task')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          projectId:
            '00000000-0000-4000-8000-000000000201',
          title: 'E2E Test Task',
          description:
            'Task created during integration testing',
          status: 'todo',
          priority: 'high',
        })
        .expect(201);

      expect(response.body).toHaveProperty('data');

      expect(response.body.data).toHaveProperty(
        'id',
      );

      expect(response.body.data.title).toBe(
        'E2E Test Task',
      );

      expect(response.body.data.status).toBe(
        'todo',
      );

      expect(response.body.data.priority).toBe(
        'high',
      );
    });
  });


  // Get By ID
  describe('GET /api/v1/task/:id', () => {
    it('should retrieve a task successfully', async () => {
      // 1. Login
      const loginResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@taskflow-demo.com',
          password: 'Password123!',
        })
        .expect(200);

      const accessToken =
        loginResponse.body.data.accessToken;

      // 2. Create a task
      const createResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/task')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          projectId:
            '00000000-0000-4000-8000-000000000201',
          title: 'Get Task E2E Test',
          description:
            'Task used for GET integration testing',
          status: 'todo',
          priority: 'medium',
        })
        .expect(201);

      const taskId = createResponse.body.data.id;

      // 3. Retrieve the task
      const response = await request(
        app.getHttpServer(),
      )
        .get(`/api/v1/task/${taskId}`)
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

      // 4. Verify response
      expect(response.body).toHaveProperty('data');

      expect(response.body.data.id).toBe(taskId);

      expect(response.body.data.title).toBe(
        'Get Task E2E Test',
      );

      expect(response.body.data.status).toBe(
        'todo',
      );

      expect(response.body.data.priority).toBe(
        'medium',
      );
    });
  });

  // Update By ID
  describe('PATCH /api/v1/task/:id', () => {
    it('should update a task successfully', async () => {
      // 1. Login
      const loginResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@taskflow-demo.com',
          password: 'Password123!',
        })
        .expect(200);

      const accessToken =
        loginResponse.body.data.accessToken;

      // 2. Create a task
      const createResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/task')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          projectId:
            '00000000-0000-4000-8000-000000000201',
          title: 'Update Task E2E Test',
          status: 'todo',
          priority: 'medium',
        })
        .expect(201);

      const taskId = createResponse.body.data.id;

      // 3. Update the task
      const response = await request(
        app.getHttpServer(),
      )
        .patch(`/api/v1/task/${taskId}`)
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          title: 'Updated E2E Task',
          status: 'in_progress',
          priority: 'high',
        })
        .expect(200);

      // 4. Verify response
      expect(response.body).toHaveProperty('data');

      expect(response.body.data.id).toBe(taskId);

      expect(response.body.data.title).toBe(
        'Updated E2E Task',
      );

      expect(response.body.data.status).toBe(
        'in_progress',
      );

      expect(response.body.data.priority).toBe(
        'high',
      );
    });
  });

  // Delete By ID
  describe('DELETE /api/v1/task/:id', () => {
    it('should delete a task successfully', async () => {
      // 1. Login
      const loginResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@taskflow-demo.com',
          password: 'Password123!',
        })
        .expect(200);

      const accessToken =
        loginResponse.body.data.accessToken;

      // 2. Create a task
      const createResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/task')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          projectId:
            '00000000-0000-4000-8000-000000000201',
          title: 'Delete Task E2E Test',
          status: 'todo',
          priority: 'medium',
        })
        .expect(201);

      const taskId = createResponse.body.data.id;

      // 3. Delete the task
      await request(app.getHttpServer())
        .delete(`/api/v1/task/${taskId}`)
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

      // 4. Verify soft-deleted task is no longer accessible
      await request(app.getHttpServer())
        .get(`/api/v1/task/${taskId}`)
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(404);
    });
  });

  // Cross tenant access
  describe('Cross-tenant access', () => {
    it('should return 403 when accessing a task from another organization', async () => {
      // 1. Login Alice (Engineering)
      const aliceLogin = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@taskflow-demo.com',
          password: 'Password123!',
        })
        .expect(200);

      const aliceToken =
        aliceLogin.body.data.accessToken;

      // 2. Login David (Design)
      const davidLogin = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'david@taskflow-demo.com',
          password: 'Password123!',
        })
        .expect(200);

      const davidToken =
        davidLogin.body.data.accessToken;

      // 3. David creates a task in Design
      const createResponse = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/task')
        .set(
          'Authorization',
          `Bearer ${davidToken}`,
        )
        .send({
          projectId:
            '00000000-0000-4000-8000-000000000203',
          title: 'Design Organization Task',
          description:
            'This task belongs to TaskFlow Design',
          status: 'todo',
          priority: 'high',
        })
        .expect(201);

      const taskId =
        createResponse.body.data.id;

      // 4. Alice tries to access David's task
      await request(app.getHttpServer())
        .get(`/api/v1/task/${taskId}`)
        .set(
          'Authorization',
          `Bearer ${aliceToken}`,
        )
        .expect(403);
    });
  });
});


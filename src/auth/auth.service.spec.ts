jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';

import { PrismaService } from 'src/prisma/prisma.service';
import { OrganizationService } from 'src/organization/organization.service';
import { OrgMemberService } from 'src/org-member/org-member.service';
import { UserService } from 'src/users/users.service';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';

describe('AuthService', () => {
    let authService: AuthService;

    const mockUserService = {
        findByEmailWithMemberships: jest.fn(),
        findById: jest.fn(),
    };

    const mockOrganizationService = {};

    const mockOrgMemberService = {
        findByUserAndOrganization: jest.fn(),
    };

    const mockRefreshTokenService = {
        create: jest.fn(),
        findByJti: jest.fn(),
        revoke: jest.fn(),
    };

    const mockPrismaService = {
        $transaction: jest.fn(
            async (callback) => callback({}),
        ),
    };

    const mockJwtService = {
        signAsync: jest.fn(),
        verifyAsync: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule =
            await Test.createTestingModule({
                providers: [
                    AuthService,

                    {
                        provide: UserService,
                        useValue: mockUserService,
                    },

                    {
                        provide: PrismaService,
                        useValue: mockPrismaService,
                    },

                    {
                        provide: OrganizationService,
                        useValue: mockOrganizationService,
                    },

                    {
                        provide: OrgMemberService,
                        useValue: mockOrgMemberService,
                    },

                    {
                        provide: RefreshTokenService,
                        useValue: mockRefreshTokenService,
                    },

                    {
                        provide: JwtService,
                        useValue: mockJwtService,
                    },
                ],
            }).compile();

        authService =
            module.get<AuthService>(AuthService);
    });

    describe('login', () => {
        it('should login a user successfully', async () => {
            // Mock user lookup
            mockUserService.findByEmailWithMemberships.mockResolvedValue({
                id: 'user-1',
                name: 'Alice',
                email: 'alice@taskflow-demo.com',
                passwordHash: '$2b$12$hashed-password',

                memberships: [
                    {
                        organizationId: 'org-1',
                        role: 'org_admin',
                        organization: {
                            name: 'TaskFlow Engineering',
                        },
                    },
                ],
            });

            // Mock password comparison
            (
                bcrypt.compare as jest.Mock
            ).mockResolvedValue(true);

            // Mock refresh token hashing
            (
                bcrypt.hash as jest.Mock
            ).mockResolvedValue(
                'hashed-refresh-token',
            );

            // Mock JWT generation
            mockJwtService.signAsync
                .mockResolvedValueOnce(
                    'access-token',
                )
                .mockResolvedValueOnce(
                    'refresh-token',
                );

            // Mock refresh token persistence
            mockRefreshTokenService.create.mockResolvedValue({
                id: 'refresh-token-record-1',
            });

            // Execute
            const result = await authService.login({
                email: 'alice@taskflow-demo.com',
                password: 'Password123!',
            });

            // Verify access token
            expect(result).toHaveProperty(
                'accessToken',
                'access-token',
            );

            // Verify refresh token
            expect(result).toHaveProperty(
                'refreshToken',
                'refresh-token',
            );

            // Narrow the union type
            if (!('user' in result)) {
                throw new Error(
                    'Expected normal login response',
                );
            }

            // Verify user information
            expect(result.user).toEqual({
                id: 'user-1',
                name: 'Alice',
                email: 'alice@taskflow-demo.com',
                organizationId: 'org-1',
                role: 'org_admin',
            });

            // Verify UserService was called correctly
            expect(
                mockUserService.findByEmailWithMemberships,
            ).toHaveBeenCalledWith(
                'alice@taskflow-demo.com',
            );

            // Verify password was checked
            expect(
                bcrypt.compare,
            ).toHaveBeenCalledWith(
                'Password123!',
                '$2b$12$hashed-password',
            );

            // Verify refresh token was hashed
            expect(
                bcrypt.hash,
            ).toHaveBeenCalledWith(
                'refresh-token',
                12,
            );

            // Verify refresh token was stored
            expect(
                mockRefreshTokenService.create,
            ).toHaveBeenCalledTimes(1);
        });

        it('should throw UnauthorizedException when user does not exist', async () => {
            mockUserService.findByEmailWithMemberships.mockResolvedValue(
                null,
            );

            await expect(
                authService.login({
                    email: 'unknown@taskflow-demo.com',
                    password: 'Password123!',
                }),
            ).rejects.toThrow(
                'Invalid email or password',
            );

            expect(
                mockUserService.findByEmailWithMemberships,
            ).toHaveBeenCalledWith(
                'unknown@taskflow-demo.com',
            );

            expect(
                bcrypt.compare,
            ).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when password is incorrect', async () => {
            mockUserService.findByEmailWithMemberships.mockResolvedValue({
                id: 'user-1',
                name: 'Alice',
                email: 'alice@taskflow-demo.com',
                passwordHash: '$2b$12$hashed-password',
                memberships: [
                    {
                        organizationId: 'org-1',
                        role: 'org_admin',
                        organization: {
                            name: 'TaskFlow Engineering',
                        },
                    },
                ],
            });

            (
                bcrypt.compare as jest.Mock
            ).mockResolvedValue(false);

            await expect(
                authService.login({
                    email: 'alice@taskflow-demo.com',
                    password: 'WrongPassword!',
                }),
            ).rejects.toThrow(
                'Invalid email or password',
            );

            expect(
                mockUserService.findByEmailWithMemberships,
            ).toHaveBeenCalledWith(
                'alice@taskflow-demo.com',
            );

            expect(
                bcrypt.compare,
            ).toHaveBeenCalledWith(
                'WrongPassword!',
                '$2b$12$hashed-password',
            );

            expect(
                mockJwtService.signAsync,
            ).not.toHaveBeenCalled();

            expect(
                mockRefreshTokenService.create,
            ).not.toHaveBeenCalled();
        });

        it('should require organization selection when user belongs to multiple organizations', async () => {
            mockUserService.findByEmailWithMemberships.mockResolvedValue({
                id: 'user-1',
                name: 'Alice',
                email: 'alice@taskflow-demo.com',
                passwordHash: '$2b$12$hashed-password',

                memberships: [
                    {
                        organizationId: 'org-1',
                        role: 'org_admin',
                        organization: {
                            name: 'TaskFlow Engineering',
                        },
                    },
                    {
                        organizationId: 'org-2',
                        role: 'member',
                        organization: {
                            name: 'TaskFlow Design',
                        },
                    },
                ],
            });

            (
                bcrypt.compare as jest.Mock
            ).mockResolvedValue(true);

            mockJwtService.signAsync.mockResolvedValue(
                'pre-auth-token',
            );

            const result = await authService.login({
                email: 'alice@taskflow-demo.com',
                password: 'Password123!',
            });

            expect(result).toEqual({
                requiresOrganizationSelection: true,
                preAuthToken: 'pre-auth-token',
                organizations: [
                    {
                        organizationId: 'org-1',
                        organizationName: 'TaskFlow Engineering',
                        role: 'org_admin',
                    },
                    {
                        organizationId: 'org-2',
                        organizationName: 'TaskFlow Design',
                        role: 'member',
                    },
                ],
            });

            expect(
                mockJwtService.signAsync,
            ).toHaveBeenCalledTimes(1);

            expect(
                mockRefreshTokenService.create,
            ).not.toHaveBeenCalled();
        });

        it('should login successfully without an organization', async () => {
            mockUserService.findByEmailWithMemberships.mockResolvedValue({
                id: 'user-2',
                name: 'Bob',
                email: 'bob@example.com',
                passwordHash: '$2b$12$hashed-password',
                memberships: [],
            });

            (
                bcrypt.compare as jest.Mock
            ).mockResolvedValue(true);

            (
                bcrypt.hash as jest.Mock
            ).mockResolvedValue(
                'hashed-refresh-token',
            );

            mockJwtService.signAsync
                .mockResolvedValueOnce('access-token')
                .mockResolvedValueOnce('refresh-token');

            mockRefreshTokenService.create.mockResolvedValue({
                id: 'refresh-token-record-2',
            });

            const result = await authService.login({
                email: 'bob@example.com',
                password: 'Password123!',
            });

            expect(result).toEqual({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                user: {
                    id: 'user-2',
                    name: 'Bob',
                    email: 'bob@example.com',
                    organizationId: null,
                    role: null,
                },
            });

            expect(
                mockRefreshTokenService.create,
            ).toHaveBeenCalledTimes(1);
        });
    });

    describe('selectOrganization', () => {
        it('should select an organization and generate tokens', async () => {
            mockOrgMemberService.findByUserAndOrganization.mockResolvedValue({
                organizationId: 'org-1',
                role: 'org_admin',
            });

            mockUserService.findById.mockResolvedValue({
                id: 'user-1',
                name: 'Alice',
                email: 'alice@taskflow-demo.com',
            });

            (
                bcrypt.hash as jest.Mock
            ).mockResolvedValue(
                'hashed-refresh-token',
            );

            mockJwtService.signAsync
                .mockResolvedValueOnce('access-token')
                .mockResolvedValueOnce('refresh-token');

            mockRefreshTokenService.create.mockResolvedValue({
                id: 'refresh-token-record-1',
            });

            const result =
                await authService.selectOrganization(
                    'user-1',
                    'org-1',
                );

            expect(result).toEqual({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                user: {
                    id: 'user-1',
                    name: 'Alice',
                    email: 'alice@taskflow-demo.com',
                    organizationId: 'org-1',
                    role: 'org_admin',
                },
            });

            expect(
                mockOrgMemberService.findByUserAndOrganization,
            ).toHaveBeenCalledWith(
                'user-1',
                'org-1',
            );

            expect(
                mockUserService.findById,
            ).toHaveBeenCalledWith(
                'user-1',
            );

            expect(
                mockRefreshTokenService.create,
            ).toHaveBeenCalledTimes(1);
        });

        it('should throw ForbiddenException when user does not belong to organization', async () => {
            mockOrgMemberService.findByUserAndOrganization.mockResolvedValue(
                null,
            );

            await expect(
                authService.selectOrganization(
                    'user-1',
                    'org-999',
                ),
            ).rejects.toThrow(
                'You do not belong to this organization',
            );

            expect(
                mockOrgMemberService.findByUserAndOrganization,
            ).toHaveBeenCalledWith(
                'user-1',
                'org-999',
            );

            expect(
                mockUserService.findById,
            ).not.toHaveBeenCalled();

            expect(
                mockJwtService.signAsync,
            ).not.toHaveBeenCalled();

            expect(
                mockRefreshTokenService.create,
            ).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when user does not exist', async () => {
            mockOrgMemberService.findByUserAndOrganization.mockResolvedValue({
                organizationId: 'org-1',
                role: 'org_admin',
            });

            mockUserService.findById.mockResolvedValue(null);

            await expect(
                authService.selectOrganization(
                    'user-1',
                    'org-1',
                ),
            ).rejects.toThrow('User not found');

            expect(
                mockOrgMemberService.findByUserAndOrganization,
            ).toHaveBeenCalledWith(
                'user-1',
                'org-1',
            );

            expect(
                mockUserService.findById,
            ).toHaveBeenCalledWith('user-1');

            expect(
                mockJwtService.signAsync,
            ).not.toHaveBeenCalled();

            expect(
                mockRefreshTokenService.create,
            ).not.toHaveBeenCalled();
        });
    });

    describe('refresh', () => {
        it('should refresh tokens successfully', async () => {
            const expiresAt = new Date(
                Date.now() + 60 * 60 * 1000,
            );

            mockJwtService.verifyAsync.mockResolvedValue({
                sub: 'user-1',
                jti: 'jti-1',
                organizationId: 'org-1',
                role: 'org_admin',
            });

            mockRefreshTokenService.findByJti.mockResolvedValue({
                id: 'refresh-record-1',
                userId: 'user-1',
                jti: 'jti-1',
                tokenHash: 'hashed-refresh-token',
                revokedAt: null,
                expiresAt,
            });

            (
                bcrypt.compare as jest.Mock
            ).mockResolvedValue(true);

            mockOrgMemberService.findByUserAndOrganization.mockResolvedValue({
                organizationId: 'org-1',
                role: 'org_admin',
            });

            mockUserService.findById.mockResolvedValue({
                id: 'user-1',
                name: 'Alice',
                email: 'alice@taskflow-demo.com',
            });

            (
                bcrypt.hash as jest.Mock
            ).mockResolvedValue(
                'new-hashed-refresh-token',
            );

            mockJwtService.signAsync
                .mockResolvedValueOnce('new-access-token')
                .mockResolvedValueOnce('new-refresh-token');

            mockRefreshTokenService.revoke.mockResolvedValue({
                id: 'refresh-record-1',
                revokedAt: new Date(),
            });

            mockRefreshTokenService.create.mockResolvedValue({
                id: 'refresh-record-2',
            });

            const result =
                await authService.refresh(
                    'old-refresh-token',
                );

            expect(result).toEqual({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
                user: {
                    id: 'user-1',
                    name: 'Alice',
                    email: 'alice@taskflow-demo.com',
                    organizationId: 'org-1',
                    role: 'org_admin',
                },
            });

            expect(
                mockJwtService.verifyAsync,
            ).toHaveBeenCalledWith(
                'old-refresh-token',
                {
                    secret:
                        process.env.JWT_REFRESH_SECRET,
                },
            );

            expect(
                mockRefreshTokenService.findByJti,
            ).toHaveBeenCalledWith('jti-1');

            expect(
                bcrypt.compare,
            ).toHaveBeenCalledWith(
                'old-refresh-token',
                'hashed-refresh-token',
            );

            expect(
                mockOrgMemberService.findByUserAndOrganization,
            ).toHaveBeenCalledWith(
                'user-1',
                'org-1',
            );

            expect(
                mockUserService.findById,
            ).toHaveBeenCalledWith('user-1');

            expect(
                mockRefreshTokenService.revoke,
            ).toHaveBeenCalledWith(
                'refresh-record-1',
            );

            expect(
                mockRefreshTokenService.create,
            ).toHaveBeenCalledTimes(1);
        });

        it('should throw UnauthorizedException when refresh token is invalid or expired', async () => {
            mockJwtService.verifyAsync.mockRejectedValue(
                new Error('Token expired'),
            );

            await expect(
                authService.refresh('invalid-refresh-token'),
            ).rejects.toThrow(
                'Invalid or expired refresh token',
            );

            expect(
                mockJwtService.verifyAsync,
            ).toHaveBeenCalledWith(
                'invalid-refresh-token',
                {
                    secret:
                        process.env.JWT_REFRESH_SECRET,
                },
            );

            expect(
                mockRefreshTokenService.findByJti,
            ).not.toHaveBeenCalled();

            expect(
                mockRefreshTokenService.revoke,
            ).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when refresh token is missing or revoked', async () => {
            mockJwtService.verifyAsync.mockResolvedValue({
                sub: 'user-1',
                jti: 'jti-1',
                organizationId: 'org-1',
                role: 'org_admin',
            });

            mockRefreshTokenService.findByJti.mockResolvedValue(null);

            await expect(
                authService.refresh('refresh-token'),
            ).rejects.toThrow(
                'Invalid or revoked refresh token',
            );

            expect(
                mockJwtService.verifyAsync,
            ).toHaveBeenCalled();

            expect(
                mockRefreshTokenService.findByJti,
            ).toHaveBeenCalledWith('jti-1');

            expect(
                mockRefreshTokenService.revoke,
            ).not.toHaveBeenCalled();

            expect(
                mockOrgMemberService.findByUserAndOrganization,
            ).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when stored refresh token is revoked', async () => {
            mockJwtService.verifyAsync.mockResolvedValue({
                sub: 'user-1',
                jti: 'jti-1',
                organizationId: 'org-1',
                role: 'org_admin',
            });

            mockRefreshTokenService.findByJti.mockResolvedValue({
                id: 'refresh-record-1',
                userId: 'user-1',
                jti: 'jti-1',
                tokenHash: 'hashed-refresh-token',
                revokedAt: new Date(),
                expiresAt: new Date(
                    Date.now() + 60 * 60 * 1000,
                ),
            });

            await expect(
                authService.refresh('refresh-token'),
            ).rejects.toThrow(
                'Invalid or revoked refresh token',
            );

            expect(
                mockRefreshTokenService.findByJti,
            ).toHaveBeenCalledWith('jti-1');

            expect(
                bcrypt.compare,
            ).not.toHaveBeenCalled();

            expect(
                mockOrgMemberService.findByUserAndOrganization,
            ).not.toHaveBeenCalled();

            expect(
                mockRefreshTokenService.revoke,
            ).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when refresh token hash does not match', async () => {
            mockJwtService.verifyAsync.mockResolvedValue({
                sub: 'user-1',
                jti: 'jti-1',
                organizationId: 'org-1',
                role: 'org_admin',
            });

            mockRefreshTokenService.findByJti.mockResolvedValue({
                id: 'refresh-record-1',
                userId: 'user-1',
                jti: 'jti-1',
                tokenHash: 'hashed-refresh-token',
                revokedAt: null,
                expiresAt: new Date(
                    Date.now() + 60 * 60 * 1000,
                ),
            });

            (
                bcrypt.compare as jest.Mock
            ).mockResolvedValue(false);

            await expect(
                authService.refresh('refresh-token'),
            ).rejects.toThrow(
                'Invalid refresh token',
            );

            expect(
                bcrypt.compare,
            ).toHaveBeenCalledWith(
                'refresh-token',
                'hashed-refresh-token',
            );

            expect(
                mockOrgMemberService.findByUserAndOrganization,
            ).not.toHaveBeenCalled();

            expect(
                mockRefreshTokenService.revoke,
            ).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when refresh token is expired', async () => {
            mockJwtService.verifyAsync.mockResolvedValue({
                sub: 'user-1',
                jti: 'jti-1',
                organizationId: 'org-1',
                role: 'org_admin',
            });

            mockRefreshTokenService.findByJti.mockResolvedValue({
                id: 'refresh-record-1',
                userId: 'user-1',
                jti: 'jti-1',
                tokenHash: 'hashed-refresh-token',
                revokedAt: null,
                expiresAt: new Date(
                    Date.now() - 60 * 60 * 1000,
                ),
            });

            (
                bcrypt.compare as jest.Mock
            ).mockResolvedValue(true);

            await expect(
                authService.refresh('refresh-token'),
            ).rejects.toThrow(
                'Refresh token expired',
            );

            expect(
                bcrypt.compare,
            ).toHaveBeenCalledWith(
                'refresh-token',
                'hashed-refresh-token',
            );

            expect(
                mockOrgMemberService.findByUserAndOrganization,
            ).not.toHaveBeenCalled();

            expect(
                mockRefreshTokenService.revoke,
            ).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when user no longer belongs to organization', async () => {
            mockJwtService.verifyAsync.mockResolvedValue({
                sub: 'user-1',
                jti: 'jti-1',
                organizationId: 'org-1',
                role: 'org_admin',
            });

            mockRefreshTokenService.findByJti.mockResolvedValue({
                id: 'refresh-record-1',
                userId: 'user-1',
                jti: 'jti-1',
                tokenHash: 'hashed-refresh-token',
                revokedAt: null,
                expiresAt: new Date(
                    Date.now() + 60 * 60 * 1000,
                ),
            });

            (
                bcrypt.compare as jest.Mock
            ).mockResolvedValue(true);

            // User is no longer a member of this organization
            mockOrgMemberService.findByUserAndOrganization.mockResolvedValue(
                null,
            );

            await expect(
                authService.refresh('refresh-token'),
            ).rejects.toThrow(
                'User no longer belongs to this organization',
            );

            expect(
                mockOrgMemberService.findByUserAndOrganization,
            ).toHaveBeenCalledWith(
                'user-1',
                'org-1',
            );

            expect(
                mockUserService.findById,
            ).not.toHaveBeenCalled();

            expect(
                mockRefreshTokenService.revoke,
            ).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when user does not exist', async () => {
            mockJwtService.verifyAsync.mockResolvedValue({
                sub: 'user-1',
                jti: 'jti-1',
                organizationId: 'org-1',
                role: 'org_admin',
            });

            mockRefreshTokenService.findByJti.mockResolvedValue({
                id: 'refresh-record-1',
                userId: 'user-1',
                jti: 'jti-1',
                tokenHash: 'hashed-refresh-token',
                revokedAt: null,
                expiresAt: new Date(
                    Date.now() + 60 * 60 * 1000,
                ),
            });

            (
                bcrypt.compare as jest.Mock
            ).mockResolvedValue(true);

            mockOrgMemberService.findByUserAndOrganization.mockResolvedValue({
                organizationId: 'org-1',
                role: 'org_admin',
            });

            // User no longer exists
            mockUserService.findById.mockResolvedValue(null);

            await expect(
                authService.refresh('refresh-token'),
            ).rejects.toThrow('User not found');

            expect(
                mockUserService.findById,
            ).toHaveBeenCalledWith('user-1');

            expect(
                mockRefreshTokenService.revoke,
            ).not.toHaveBeenCalled();
        });
    });

});
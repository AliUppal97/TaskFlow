import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from '../../entities/user.entity';
import { RegisterDto } from '../../dto/auth.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheResult, InvalidateCache } from '../../common/cache/cache.decorators';

/**
 * User Service - User account management
 * 
 * Responsibilities:
 * - User CRUD operations
 * - Password hashing and validation
 * - Refresh token management (Redis)
 * - User profile management
 * 
 * Security:
 * - Password hashing with bcrypt (12 salt rounds)
 * - Email uniqueness validation
 * - Cache invalidation on user updates
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cacheService: CacheService,
  ) {}

  /**
   * Create a new user account
   * 
   * Security:
   * - Email uniqueness check (prevents duplicate accounts)
   * - Password hashed with bcrypt (12 rounds = strong security)
   * - Default role: USER (admin role must be set explicitly)
   * 
   * Cache:
   * - Invalidates user cache on creation
   * - Caches new user for 1 hour
   * 
   * @param registerDto - User registration data
   * @returns Created user entity (password hash excluded)
   */
  @InvalidateCache('user:*')
  async create(registerDto: RegisterDto): Promise<User> {
    const { email, password, role = UserRole.USER, profile } = registerDto;

    // Prevent duplicate accounts (email is unique)
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    /**
     * Password hashing with bcrypt
     * Salt rounds: 12 (balance between security and performance)
     * Higher rounds = more secure but slower (12 is industry standard)
     */
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      role,
      profile,
    });

    const savedUser = await this.userRepository.save(user);

    // Cache user data
    await this.cacheService.set(
      this.cacheService.generateKey(CacheService.KEYS.USER, savedUser.id),
      savedUser,
      { ttl: 3600 } // 1 hour
    );

    return savedUser;
  }

  @CacheResult({ ttl: 3600, keyPrefix: 'user' })
  async findById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user;
  }

  @CacheResult({ ttl: 3600, keyPrefix: 'user:email' })
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user;
  }

  /**
   * Validate user credentials
   * 
   * Security:
   * - Returns null for invalid credentials (prevents user enumeration)
   * - Uses bcrypt.compare for constant-time password verification
   * - Does not reveal whether email or password is incorrect
   * 
   * @param email - User email
   * @param password - Plain text password
   * @returns User entity if valid, null otherwise
   */
  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null; // User not found (don't reveal this for security)
    }

    // Constant-time password comparison (prevents timing attacks)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null; // Invalid password
    }

    return user;
  }

  @InvalidateCache('user:*')
  async updateProfile(id: string, profile: Partial<User['profile']>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.profile = { ...user.profile, ...profile };
    user.updatedAt = new Date();

    const updatedUser = await this.userRepository.save(user);

    return updatedUser;
  }

  @InvalidateCache('user:*')
  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    user.updatedAt = new Date();

    const updatedUser = await this.userRepository.save(user);

    return updatedUser;
  }

  @InvalidateCache('user:*')
  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
  }

  /**
   * Refresh token management (stored in Redis)
   * 
   * Security strategy:
   * - Refresh token ID stored in Redis (not the full token)
   * - Enables token revocation (logout, security breach)
   * - TTL matches refresh token expiration (7 days)
   * 
   * Benefits:
   * - Can invalidate all user sessions by deleting token ID
   * - No database queries needed (Redis is fast)
   * - Automatic expiration via TTL
   */
  
  /**
   * Store refresh token ID for a user
   * Used to validate and revoke refresh tokens
   * 
   * @param userId - User ID
   * @param tokenId - Unique refresh token ID
   */
  async storeRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.cacheService.set(
      this.cacheService.generateKey(CacheService.KEYS.REFRESH_TOKEN, userId),
      tokenId,
      { ttl: 7 * 24 * 60 * 60 } // 7 days (matches refresh token expiration)
    );
  }

  /**
   * Get stored refresh token ID for a user
   * Used to validate refresh token during token refresh
   * 
   * @param userId - User ID
   * @returns Refresh token ID or null if not found
   */
  async getStoredRefreshToken(userId: string): Promise<string | null> {
    return this.cacheService.get(
      this.cacheService.generateKey(CacheService.KEYS.REFRESH_TOKEN, userId)
    );
  }

  /**
   * Remove refresh token ID (logout or security breach)
   * Invalidates all refresh tokens for the user
   * 
   * @param userId - User ID
   */
  async removeRefreshToken(userId: string): Promise<void> {
    await this.cacheService.delete(
      this.cacheService.generateKey(CacheService.KEYS.REFRESH_TOKEN, userId)
    );
  }

  // Get users with pagination (for admin)
  async findAll(options: {
    page?: number;
    limit?: number;
    role?: UserRole;
  } = {}): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, role } = options;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.where('user.role = :role', { role });
    }

    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return { users, total };
  }
}

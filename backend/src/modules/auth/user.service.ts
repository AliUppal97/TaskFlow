import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from '../../entities/user.entity';
import { RegisterDto } from '../../dto/auth.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheResult, InvalidateCache } from '../../common/cache/cache.decorators';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cacheService: CacheService,
  ) {}

  @InvalidateCache('user:*')
  async create(registerDto: RegisterDto): Promise<User> {
    const { email, password, role = UserRole.USER, profile } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
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

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
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

  // Refresh token management (store in Redis)
  async storeRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.cacheService.set(
      this.cacheService.generateKey(CacheService.KEYS.REFRESH_TOKEN, userId),
      tokenId,
      { ttl: 7 * 24 * 60 * 60 } // 7 days
    );
  }

  async getStoredRefreshToken(userId: string): Promise<string | null> {
    return this.cacheService.get(
      this.cacheService.generateKey(CacheService.KEYS.REFRESH_TOKEN, userId)
    );
  }

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

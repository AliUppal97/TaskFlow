import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from './user.service';
import { User, UserRole } from '../../entities/user.entity';
import { RegisterDto } from '../../dto/auth.dto';
import { CacheService } from '../../common/cache/cache.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let cacheService: CacheService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.USER,
    profile: { firstName: 'Test', lastName: 'User' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
    generateKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
        profile: { firstName: 'Test', lastName: 'User' },
      };

      const savedUser = { ...mockUser };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(savedUser);
      mockRepository.save.mockResolvedValue(savedUser);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.create(registerDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: expect.any(String),
        role: registerDto.role,
        profile: registerDto.profile,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(savedUser);
      expect(mockCacheService.set).toHaveBeenCalled();
      expect(result).toEqual(savedUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(registerDto)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('findById', () => {
    it('should return cached user if available', async () => {
      mockCacheService.get.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(mockCacheService.get).toHaveBeenCalledWith(`user:${mockUser.id}`);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should fetch from database and cache if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.findById(mockUser.id);

      expect(mockCacheService.get).toHaveBeenCalledWith(`user:${mockUser.id}`);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(mockCacheService.set).toHaveBeenCalledWith(`user:${mockUser.id}`, mockUser, { ttl: 3600 });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return cached user if available', async () => {
      mockCacheService.get.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(mockCacheService.get).toHaveBeenCalledWith(`user:email:${mockUser.email}`);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should fetch from database and cache if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.findByEmail(mockUser.email);

      expect(mockCacheService.get).toHaveBeenCalledWith(`user:email:${mockUser.email}`);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(mockCacheService.set).toHaveBeenCalledWith(`user:email:${mockUser.email}`, mockUser, { ttl: 3600 });
      expect(result).toEqual(mockUser);
    });
  });

  describe('validatePassword', () => {
    it('should return user if password is valid', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockCacheService.get.mockResolvedValue(mockUser);

      // Mock bcrypt.compare
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validatePassword(mockUser.email, 'correct-password');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.validatePassword('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockCacheService.get.mockResolvedValue(mockUser);

      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const result = await service.validatePassword(mockUser.email, 'wrong-password');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const newProfile = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, profile: newProfile };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);
      mockCacheService.get.mockResolvedValue(mockUser);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.updateProfile(mockUser.id, newProfile);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result.profile).toEqual(newProfile);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('non-existent-id', {})).rejects.toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.remove.mockResolvedValue(mockUser);
      mockCacheService.get.mockResolvedValue(mockUser);

      await service.delete(mockUser.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`user:${mockUser.id}`);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`user:email:${mockUser.email}`);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow('User not found');
    });
  });

  describe('findAll', () => {
    it('should return users with pagination', async () => {
      const mockUsers = [mockUser];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUsers, 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({ users: mockUsers, total: 1 });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should filter by role when provided', async () => {
      const mockUsers = [mockUser];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUsers, 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ role: UserRole.ADMIN });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.role = :role', { role: UserRole.ADMIN });
    });
  });
});





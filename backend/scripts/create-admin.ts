#!/usr/bin/env ts-node

/**
 * Bootstrap Script: Create Admin User
 * 
 * This script creates an admin user in the database.
 * Run this script to bootstrap your first admin user.
 * 
 * Usage:
 *   npm run create-admin
 *   npm run create-admin -- --email admin@example.com --password SecurePass123!
 *   ts-node scripts/create-admin.ts --email admin@example.com --password SecurePass123!
 * 
 * Environment Variables:
 *   - DATABASE_HOST (default: localhost)
 *   - DATABASE_PORT (default: 5432)
 *   - DATABASE_USERNAME (default: postgres)
 *   - DATABASE_PASSWORD (default: password)
 *   - DATABASE_NAME (default: taskflow)
 * 
 * Command Line Arguments:
 *   --email <email>        Admin email (required)
 *   --password <password>  Admin password (required, min 8 chars)
 *   --firstName <name>     First name (optional)
 *   --lastName <name>      Last name (optional)
 *   --update               Update existing user to admin (default: false)
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../src/entities/user.entity';
import { Task } from '../src/entities/task.entity';
import { ConfigService } from '@nestjs/config';

// Parse command line arguments
function parseArgs() {
  const args: Record<string, string> = {};
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) {
      const key = process.argv[i].slice(2);
      const value = process.argv[i + 1];
      if (value && !value.startsWith('--')) {
        args[key] = value;
        i++;
      } else {
        args[key] = 'true';
      }
    }
  }
  return args;
}

// Create a simple config service for the script
const configService = new ConfigService({
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    name: process.env.DATABASE_NAME || 'taskflow',
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
  },
});

async function createAdminUser() {
  console.log('\n=== Create Admin User ===\n');

  const args = parseArgs();
  const email = args.email || process.env.ADMIN_EMAIL;
  const password = args.password || process.env.ADMIN_PASSWORD;
  const firstName = args.firstName || process.env.ADMIN_FIRST_NAME || '';
  const lastName = args.lastName || process.env.ADMIN_LAST_NAME || '';
  const updateExisting = args.update === 'true' || process.env.ADMIN_UPDATE === 'true';

  // Validate required fields
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid or missing email address');
    console.error('Usage: npm run create-admin -- --email admin@example.com --password SecurePass123!');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    console.error('Usage: npm run create-admin -- --email admin@example.com --password SecurePass123!');
    process.exit(1);
  }

  // Create database connection
  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: configService.get('database.host', 'localhost'),
    port: configService.get('database.port', 5432),
    username: configService.get('database.username', 'postgres'),
    password: configService.get('database.password', 'password'),
    database: configService.get('database.name', 'taskflow'),
    entities: [User, Task], // Include both entities for relation metadata
    synchronize: false, // Never auto-sync in scripts
    logging: false,
  };
  
  const dataSource = new DataSource(dataSourceOptions);

  try {
    console.log('📡 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Check if user already exists
    const userRepository = dataSource.getRepository(User);
    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      if (existingUser.role === UserRole.ADMIN) {
        console.log(`⚠️  User ${email} is already an admin.`);
      } else if (updateExisting) {
        console.log(`⚠️  User with email ${email} already exists. Updating to admin...`);
        existingUser.role = UserRole.ADMIN;
        await userRepository.save(existingUser);
        console.log(`✅ User ${email} has been updated to admin role.`);
      } else {
        console.log(`⚠️  User with email ${email} already exists.`);
        console.log(`   To update this user to admin, run:`);
        console.log(`   npm run create-admin -- --email ${email} --password <password> --update`);
        process.exit(1);
      }
    } else {
      // Hash password
      console.log('🔐 Hashing password...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create admin user
      console.log('👤 Creating admin user...');
      const adminUser = userRepository.create({
        email,
        passwordHash,
        role: UserRole.ADMIN,
        profile: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        },
        isActive: true,
      });

      await userRepository.save(adminUser);
      console.log(`✅ Admin user created successfully!`);
      console.log(`\n📧 Email: ${email}`);
      console.log(`🔑 Role: ${UserRole.ADMIN}`);
      console.log(`\nYou can now log in with these credentials.`);
    }

    await dataSource.destroy();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the script
createAdminUser().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


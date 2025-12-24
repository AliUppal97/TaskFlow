#!/usr/bin/env ts-node

/**
 * Script: Verify User Role
 * 
 * This script checks a user's role in the database.
 * Useful for verifying if a user has admin role or not.
 * 
 * Usage:
 *   npm run verify-role -- --email user@example.com
 *   ts-node scripts/verify-user-role.ts --email user@example.com
 * 
 * Environment Variables:
 *   - DATABASE_HOST (default: localhost)
 *   - DATABASE_PORT (default: 5432)
 *   - DATABASE_USERNAME (default: postgres)
 *   - DATABASE_PASSWORD (default: password)
 *   - DATABASE_NAME (default: taskflow)
 */

import { DataSource, DataSourceOptions } from 'typeorm';
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

async function verifyUserRole() {
  console.log('\n=== Verify User Role ===\n');

  const args = parseArgs();
  const email = args.email || process.env.USER_EMAIL;

  if (!email || !email.includes('@')) {
    console.error('❌ Invalid or missing email address');
    console.error('Usage: npm run verify-role -- --email user@example.com');
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
    entities: [User, Task],
    synchronize: false,
    logging: false,
  };

  const dataSource = new DataSource(dataSourceOptions);

  try {
    console.log('📡 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      console.log(`❌ User with email ${email} not found in database.`);
      process.exit(1);
    }

    console.log('📋 User Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Email:     ${user.email}`);
    console.log(`  ID:        ${user.id}`);
    console.log(`  Role:      ${user.role.toUpperCase()}`);
    console.log(`  Active:    ${user.isActive ? 'Yes' : 'No'}`);
    
    if (user.profile?.firstName || user.profile?.lastName) {
      console.log(`  Name:      ${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim());
    }
    
    console.log(`  Created:   ${user.createdAt.toLocaleString()}`);
    console.log(`  Updated:   ${user.updatedAt.toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Role verification
    if (user.role === UserRole.ADMIN) {
      console.log('✅ This user HAS admin role.');
      console.log('   They should be able to access the admin dashboard.');
    } else {
      console.log('⚠️  This user does NOT have admin role.');
      console.log(`   Current role: ${user.role}`);
      console.log('   They cannot access the admin dashboard.');
      console.log('\n   To make this user an admin, run:');
      console.log(`   npm run create-admin -- --email ${email} --password <password> --update`);
    }

    // Check if account is active
    if (!user.isActive) {
      console.log('\n⚠️  WARNING: This account is deactivated.');
      console.log('   The user cannot log in until the account is activated.');
    }

    await dataSource.destroy();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error verifying user role:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the script
verifyUserRole().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});



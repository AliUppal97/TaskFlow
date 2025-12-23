/**
 * User-related interfaces
 */

import { UserRole } from '../enums';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface UserProfileExtended extends User {
  fullName: string;
}

export interface UserQueryParams {
  role?: string;
  limit?: number;
  page?: number;
  search?: string;
}







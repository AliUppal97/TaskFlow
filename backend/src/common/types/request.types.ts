import { Request } from 'express';
import { User } from '../../entities/user.entity';
import * as multer from 'multer';

/**
 * Extended Express Request interface with user property
 * Used in authenticated routes where user is attached by guards
 */
export interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * Extended Express Request interface for file uploads
 */
export interface FileUploadRequest extends Request {
  file?: multer.File;
  files?: multer.File[];
}

/**
 * Generic request interface for policy checks
 */
export interface PolicyRequest {
  user?: User;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  method?: string;
  url?: string;
}

/**
 * WebSocket client interface for authenticated connections
 */
export interface AuthenticatedSocket {
  user: User;
  handshake: {
    auth?: {
      token?: string;
    };
    query?: Record<string, unknown>;
  };
}

/**
 * Error-related types
 */

import { AxiosError } from 'axios';
import { ApiErrorResponse } from '../interfaces/api.types';

/**
 * Type guard to check if error is an Axios error
 */
export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Type guard to check if error has a response property
 */
export function hasErrorResponse(error: unknown): error is AxiosError<ApiErrorResponse> {
  return isAxiosError(error) && error.response !== undefined;
}

/**
 * Extracts error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (hasErrorResponse(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}



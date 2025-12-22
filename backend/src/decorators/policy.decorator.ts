import { SetMetadata } from '@nestjs/common';
import { PolicyRequest } from '../common/types';

export const POLICY_KEY = 'policy';

export interface PolicyConfig<T = unknown> {
  policyName: string;
  action: string;
  resourceType: string;
  getResource?: (request: PolicyRequest) => T;
}

export const UsePolicy = (config: PolicyConfig) =>
  SetMetadata(POLICY_KEY, config);








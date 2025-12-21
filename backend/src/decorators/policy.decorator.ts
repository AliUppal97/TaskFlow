import { SetMetadata } from '@nestjs/common';

export const POLICY_KEY = 'policy';

export interface PolicyConfig {
  policyName: string;
  action: string;
  resourceType: string;
  getResource?: (request: any) => any;
}

export const UsePolicy = (config: PolicyConfig) =>
  SetMetadata(POLICY_KEY, config);





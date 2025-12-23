import { Injectable, CanActivate, ExecutionContext, Inject, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IPolicy, PolicyContext } from '../common/interfaces/policy.interface';
import { POLICY_KEY } from '../decorators/policy.decorator';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('POLICIES') private policies: Map<string, IPolicy>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyConfig = this.reflector.getAllAndOverride(POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!policyConfig) {
      return true; // No policy required
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const { policyName, action, resourceType, getResource } = policyConfig;
    const policy = this.policies.get(policyName);

    if (!policy) {
      throw new UnauthorizedException(`Policy ${policyName} not found`);
    }

    let resource = null;
    if (getResource) {
      resource = getResource(request);
    }

    const policyContext: PolicyContext = {
      user,
      resource,
      action,
      resourceType,
    };

    const isAllowed = await policy.handle(policyContext);

    if (!isAllowed) {
      throw new UnauthorizedException(
        `Access denied for action '${action}' on resource '${resourceType}'`
      );
    }

    return true;
  }
}









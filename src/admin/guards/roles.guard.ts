import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../entities/admin.entity';

export const ROLES_KEY = 'roles';

export function Roles(...roles: AdminRole[]): MethodDecorator & ClassDecorator {
  return (target: any, key?: any, descriptor?: any) => {
    const roles_list = roles;
    if (descriptor) {
      Reflect.defineMetadata(ROLES_KEY, roles_list, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(ROLES_KEY, roles_list, target);
    return target;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<AdminRole[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!requiredRoles.includes(user?.role)) {
      throw new ForbiddenException('Acesso negado. Permissão insuficiente.');
    }
    return true;
  }
}

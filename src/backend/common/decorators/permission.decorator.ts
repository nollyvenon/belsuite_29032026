import { SetMetadata } from '@nestjs/common';

/**
 * Requires specific permissions for endpoint
 * Usage: @RequirePermission('create:content', 'edit:content')
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

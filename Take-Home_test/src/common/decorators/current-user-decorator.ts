import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Creates a decorator for accessing the authenticated user from the request context.
 * This decorator is typically used in route handlers to access the user information
 * after authentication middleware has been applied.
 *
 * @param data unused parameter for the decorator
 * @param ctx the execution context containing the request context
 * @returns the authenticated user object from the request context, or null if no user is authenticated
 */
export const CurrentUser = createParamDecorator(
  /**
   * The decorator function that is called when the decorator is used in a route handler.
   *
   * @param data unused parameter for the decorator
   * @param ctx the execution context containing the request context
   * @returns the authenticated user object from the request context, or null if no user is authenticated
   */
  (data: unknown, ctx: ExecutionContext): any | null => {
    const contextType = ctx.getType();

    switch (contextType) {
      case 'http': {
        return ctx.switchToHttp().getRequest().user as any;
      }

      default:
        return null;
    }
  },
);

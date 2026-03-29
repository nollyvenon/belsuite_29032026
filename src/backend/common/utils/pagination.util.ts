/**
 * Pagination utility for database queries
 */
export class PaginationUtil {
  static getPaginationParams(
    page: number = 1,
    limit: number = 10,
    maxLimit: number = 100,
  ): { skip: number; take: number } {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(Math.max(1, limit), maxLimit);

    return {
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    };
  }

  static buildPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ) {
    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }
}

export interface BaseFilterParams {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    [key: string]: string | string[] | number | boolean | undefined | { min: number; max: number } | { start: string; end: string };
}


export const buildQueryParams = (
    filterParams: BaseFilterParams,
    defaultLimit: number = 10
): string => {
    const urlParams = new URLSearchParams();

    // Add pagination
    if (filterParams.page) {
        urlParams.append('page', filterParams.page.toString());
    }
    
    urlParams.append('limit', (filterParams.limit || defaultLimit).toString());

    // Add search if provided
    if (filterParams.search?.trim()) {
        urlParams.append('search', filterParams.search.trim());
    }

    // Add sorting
    if (filterParams.sortBy) {
        urlParams.append('sortBy', filterParams.sortBy);
        urlParams.append('sortOrder', filterParams.sortOrder || 'asc');
    }

    // Add other filter parameters (excluding the ones we've already handled)
    Object.entries(filterParams).forEach(([key, value]) => {
        if (['page', 'limit', 'search', 'sortBy', 'sortOrder'].includes(key)) {
            return; // Skip already handled parameters
        }
        // More robust empty value checking
        if (value !== undefined && value !== null && value !== '' && value !== 0 && !(Array.isArray(value) && value.length === 0)) {
            if (typeof value === 'string' && value.trim() === '') {
                return;
            }
            
            if (Array.isArray(value)) {
                // Handle arrays (like pgId with multiple values) - join with commas
                const filteredArray = value.filter(v => v !== undefined && v !== null && v !== '');
                if (filteredArray.length > 0) {
                    urlParams.append(key, filteredArray.join(','));
                }
            } else if (typeof value === 'object' && 'min' in value && 'max' in value) {
                // Handle range objects (like ageRange)
                const rangeValue = value as { min: number; max: number };
                if (rangeValue.min !== undefined) {
                    urlParams.append(`${key}Min`, rangeValue.min.toString());
                }
                if (rangeValue.max !== undefined) {
                    urlParams.append(`${key}Max`, rangeValue.max.toString());
                }
            } else {
                // Handle regular string/number/boolean values
                urlParams.append(key, value.toString());
            }
        }
    });

    return urlParams.toString();
};


export interface DashboardFilterParams extends BaseFilterParams {
    work?: string;
    status?: string;
    paymentStatus?: string;
    location?: string;
    pgLocation?: string;
    pgId?: string | string[];
    roomId?: string;
    rentType?: string;
    ageRange?: { min: number; max: number };
}

export const buildDashboardQueryParams = (
    page: number,
    filterParams: Omit<DashboardFilterParams, 'page' | 'limit'>,
    sortKey?: string | null,
    sortDirection: 'asc' | 'desc' = 'asc',
    limit: number = 10
): string => {
    const params: DashboardFilterParams = {
        page,
        limit,
        ...filterParams,
    };

    if (sortKey) {
        params.sortBy = sortKey;
        params.sortOrder = sortDirection;
    }

    // Handle age range specifically
    if (filterParams.ageRange && typeof filterParams.ageRange === 'object' && 'min' in filterParams.ageRange && 'max' in filterParams.ageRange) {
        params.ageRange = filterParams.ageRange;
    }

    return buildQueryParams(params, limit);
};


export interface MembersFilterParams extends BaseFilterParams {
    enrollment?: string;
    work?: string;
    status?: string;
    location?: string;
    roomType?: string;
}

export const buildMembersQueryParams = (
    page: number,
    filterParams: Omit<MembersFilterParams, 'page' | 'limit'>,
    sortKey?: string | null,
    sortDirection: 'asc' | 'desc' = 'asc',
    limit: number = 10
): string => {
    const params: MembersFilterParams = {
        page,
        limit,
        ...filterParams,
    };

    if (sortKey) {
        params.sortBy = sortKey;
        params.sortOrder = sortDirection;
    }

    return buildQueryParams(params, limit);
};


export interface RoomsFilterParams extends BaseFilterParams {
    roomType?: string;
    status?: string;
    floor?: string;
    occupancy?: string;
}

export const buildRoomsQueryParams = (
    page: number,
    filterParams: Omit<RoomsFilterParams, 'page' | 'limit'>,
    sortKey?: string | null,
    sortDirection: 'asc' | 'desc' = 'asc',
    limit: number = 10
): string => {
    const params: RoomsFilterParams = {
        page,
        limit,
        ...filterParams,
    };

    if (sortKey) {
        params.sortBy = sortKey;
        params.sortOrder = sortDirection;
    }

    return buildQueryParams(params, limit);
};


export interface ReportsFilterParams extends BaseFilterParams {
    type?: string;
    dateRange?: { start: string; end: string };
    status?: string;
}

export const buildReportsQueryParams = (
    page: number,
    filterParams: Omit<ReportsFilterParams, 'page' | 'limit'>,
    sortKey?: string | null,
    sortDirection: 'asc' | 'desc' = 'asc',
    limit: number = 10
): string => {
    const params: BaseFilterParams = {
        page,
        limit,
        ...filterParams,
    };

    if (sortKey) {
        params.sortBy = sortKey;
        params.sortOrder = sortDirection;
    }

    // Handle date range specifically
    if (filterParams.dateRange && typeof filterParams.dateRange === 'object' && 'start' in filterParams.dateRange && 'end' in filterParams.dateRange) {
        params.startDate = filterParams.dateRange.start;
        params.endDate = filterParams.dateRange.end;
        // Remove the dateRange object since we've converted it
        delete params.dateRange;
    }

    return buildQueryParams(params, limit);
};

export interface EnquiryFilterParams extends BaseFilterParams {
    status?: string;
    resolvedBy?: string;
}

export const buildEnquiryQueryParams = (
    page: number,
    filterParams: Omit<EnquiryFilterParams, 'page' | 'limit'>,
    sortKey?: string | null,
    sortDirection: 'asc' | 'desc' = 'asc',
    limit: number = 10
): string => {
    const params: EnquiryFilterParams = {
        page,
        limit,
        ...filterParams,
    };

    if (sortKey) {
        params.sortBy = sortKey;
        params.sortOrder = sortDirection;
    }

    return buildQueryParams(params, limit);
};

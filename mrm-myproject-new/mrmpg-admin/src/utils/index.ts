export { AuthManager } from "./authUtils";
export { ApiClient } from "./authManager";
export { 
    buildQueryParams, 
    buildDashboardQueryParams,
    buildMembersQueryParams,
    buildRoomsQueryParams,
    buildReportsQueryParams,
    buildEnquiryQueryParams
} from "./queryBuilder";
export type { 
    BaseFilterParams,
    DashboardFilterParams,
    MembersFilterParams,
    RoomsFilterParams,
    ReportsFilterParams,
    EnquiryFilterParams
} from "./queryBuilder";
export { 
    getImage, 
    getImageSync, 
    useImage, 
    clearImageCache, 
    preloadImages 
} from "./imageUtils";
export { default as ImageUtility } from "./imageUtils";

// Utility functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

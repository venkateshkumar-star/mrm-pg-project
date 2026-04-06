export interface AuthData {
  token: string;
  user: {
    id: string;
    username: string;
    email?: string;
    role?: string;
    [key: string]: unknown;
  };
  expiresIn: string;
  loginTimestamp: number;
}

export class AuthManager {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly STAFF_KEY = 'staffData';
  private static readonly EXPIRY_KEY = 'tokenExpiryTime';
  private static readonly LOGIN_TIME_KEY = 'loginTimestamp';

  private static parseExpirationTime(expiresIn: string): number {
    const timeUnit = expiresIn.slice(-1);
    const timeValue = parseInt(expiresIn.slice(0, -1), 10);

    if (isNaN(timeValue)) {
      throw new Error(`Invalid expiration time format: ${expiresIn}`);
    }

    switch (timeUnit.toLowerCase()) {
      case 's': // seconds
        return timeValue * 1000;
      case 'm': // minutes
        return timeValue * 60 * 1000;
      case 'h': // hours
        return timeValue * 60 * 60 * 1000;
      case 'd': // days
        return timeValue * 24 * 60 * 60 * 1000;
      case 'w': // weeks
        return timeValue * 7 * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unsupported time unit: ${timeUnit}`);
    }
  }

  // Store authentication data
  static setAuthData(data: { token: string; admin: unknown; expiresIn: string }): void {
    const loginTimestamp = Date.now();
    
    try {
      const expirationDuration = this.parseExpirationTime(data.expiresIn);
      const expiryTime = loginTimestamp + expirationDuration;

      localStorage.setItem(this.TOKEN_KEY, data.token);
      localStorage.setItem(this.STAFF_KEY, JSON.stringify(data.admin));
      localStorage.setItem(this.EXPIRY_KEY, expiryTime.toString());
      localStorage.setItem(this.LOGIN_TIME_KEY, loginTimestamp.toString());
      
      // Backup in sessionStorage
      sessionStorage.setItem(this.TOKEN_KEY, data.token);
      sessionStorage.setItem(this.STAFF_KEY, JSON.stringify(data.admin));
      
    } catch (error) {
      console.error('Error parsing expiration time:', error);
      // Fallback: set expiry to 24 hours
      const fallbackExpiry = loginTimestamp + (24 * 60 * 60 * 1000);
      localStorage.setItem(this.EXPIRY_KEY, fallbackExpiry.toString());
      localStorage.setItem(this.LOGIN_TIME_KEY, loginTimestamp.toString());
    }
  }

  // Get authentication token
  static getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    
    if (token && this.isTokenValid()) {
      return token;
    }
    
    // Token expired or invalid, clear storage
    if (token && !this.isTokenValid()) {
      this.clearAuthData();
    }
    
    return null;
  }

  // Get user data
  static getStaffData(): unknown | null {
    const staffData = localStorage.getItem(this.STAFF_KEY) || sessionStorage.getItem(this.STAFF_KEY);

    if (staffData && this.isTokenValid()) {
      try {
        return JSON.parse(staffData);
      } catch (error) {
        console.error('Error parsing staff data:', error);
        this.clearAuthData();
        return null;
      }
    }
    
    return null;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && this.isTokenValid();
  }

  // Check if token is still valid
  static isTokenValid(): boolean {
    const expiryTime = localStorage.getItem(this.EXPIRY_KEY);
    
    if (!expiryTime) {
      return false;
    }
    
    const expiry = parseInt(expiryTime, 10);
    const currentTime = Date.now();
    
    return currentTime < expiry;
  }

  // Get time remaining until token expires (in milliseconds)
  static getTimeUntilExpiry(): number {
    const expiryTime = localStorage.getItem(this.EXPIRY_KEY);
    
    if (!expiryTime) {
      return 0;
    }
    
    const expiry = parseInt(expiryTime, 10);
    const currentTime = Date.now();
    
    return Math.max(0, expiry - currentTime);
  }

  // Get formatted time remaining until expiry
  static getFormattedTimeUntilExpiry(): string {
    const timeRemaining = this.getTimeUntilExpiry();
    
    if (timeRemaining === 0) {
      return 'Expired';
    }

    const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Get token expiry date
  static getTokenExpiryDate(): Date | null {
    const expiryTime = localStorage.getItem(this.EXPIRY_KEY);
    
    if (!expiryTime) {
      return null;
    }
    
    return new Date(parseInt(expiryTime, 10));
  }

  // Get login timestamp
  static getLoginTimestamp(): Date | null {
    const loginTime = localStorage.getItem(this.LOGIN_TIME_KEY);
    
    if (!loginTime) {
      return null;
    }
    
    return new Date(parseInt(loginTime, 10));
  }

  // Check if token will expire soon (within specified minutes)
  static willExpireSoon(minutesThreshold: number = 30): boolean {
    const timeRemaining = this.getTimeUntilExpiry();
    const thresholdMs = minutesThreshold * 60 * 1000;
    
    return timeRemaining > 0 && timeRemaining <= thresholdMs;
  }

  // Clear all authentication data
  static clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.STAFF_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
    localStorage.removeItem(this.LOGIN_TIME_KEY);
    
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.STAFF_KEY);
  }

  // Get authorization header for API calls
  static getAuthHeader(): { Authorization: string } | { [key: string]: unknown } {
    const token = this.getToken();
    
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    
    return {};
  }

  // Get authentication status with detailed info
  static getAuthStatus(): {
    isAuthenticated: boolean;
    timeUntilExpiry: number;
    formattedTimeUntilExpiry: string;
    willExpireSoon: boolean;
    expiryDate: Date | null;
    loginDate: Date | null;
    staffData: unknown | null;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      timeUntilExpiry: this.getTimeUntilExpiry(),
      formattedTimeUntilExpiry: this.getFormattedTimeUntilExpiry(),
      willExpireSoon: this.willExpireSoon(),
      expiryDate: this.getTokenExpiryDate(),
      loginDate: this.getLoginTimestamp(),
      staffData: this.getStaffData()
    };
  }
}
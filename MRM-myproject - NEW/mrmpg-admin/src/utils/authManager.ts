  import { AuthManager } from './authUtils';

export class ApiClient {
  private static baseURL = import.meta.env.VITE_APP_API_URL;

  // Make authenticated API calls
  static async makeAuthenticatedRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const authHeaders = AuthManager.getAuthHeader();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    // Handle token expiry
    if (response.status === 401) {
      AuthManager.clearAuthData();
      window.location.href = '/login';
      throw new Error('Authentication expired');
    }
    
    return response;
  }

  // GET request
  static async get(endpoint: string): Promise<unknown> {
    const response = await this.makeAuthenticatedRequest(endpoint, {
      method: 'GET',
    });
    
    return response.json();
  }

  // POST request
  static async post(endpoint: string, data: unknown): Promise<unknown> {
    const response = await this.makeAuthenticatedRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return response.json();
  }

  // POST request without auth (for login)
  static async postWithoutAuth(endpoint: string, data: unknown): Promise<unknown> {
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    return response.json();
  }

  // PUT request
  static async put(endpoint: string, data: unknown): Promise<unknown> {
    const response = await this.makeAuthenticatedRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return response.json();
  }

  // PATCH request
  static async patch(endpoint: string, data: unknown): Promise<unknown> {
    const response = await this.makeAuthenticatedRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    return response.json();
  }

  // DELETE request
  static async delete(endpoint: string): Promise<unknown> {
    const response = await this.makeAuthenticatedRequest(endpoint, {
      method: 'DELETE',
    });
    
    return response.json();
  }

  // POST request with FormData (for file uploads)
  static async postFormData(endpoint: string, formData: FormData): Promise<unknown> {
    const authHeaders = AuthManager.getAuthHeader();
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, browser will set it with boundary
        ...(authHeaders as Record<string, string>),
      },
      body: formData,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    // Handle token expiry
    if (response.status === 401) {
      AuthManager.clearAuthData();
      window.location.href = '/login';
      throw new Error('Authentication expired');
    }
    
    return response.json();
  }

  // PUT request with FormData (for file uploads)
  static async putFormData(endpoint: string, formData: FormData): Promise<unknown> {
    const authHeaders = AuthManager.getAuthHeader();
    
    const config: RequestInit = {
      method: 'PUT',
      headers: {
        // Don't set Content-Type for FormData, browser will set it with boundary
        ...(authHeaders as Record<string, string>),
      },
      body: formData,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    // Handle token expiry
    if (response.status === 401) {
      AuthManager.clearAuthData();
      window.location.href = '/login';
      throw new Error('Authentication expired');
    }
    
    return response.json();
  }

   // PATCH request with FormData (for file uploads)
  static async patchFormData(endpoint: string, formData: FormData): Promise<unknown> {
    const authHeaders = AuthManager.getAuthHeader();
    
    const config: RequestInit = {
      method: 'PATCH',
      headers: {
        // Don't set Content-Type for FormData, browser will set it with boundary
        ...(authHeaders as Record<string, string>),
      },
      body: formData,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    // Handle token expiry
    if (response.status === 401) {
      AuthManager.clearAuthData();
      window.location.href = '/login';
      throw new Error('Authentication expired');
    }
    
    return response.json();
  }

}
import { fetchWrapper } from '../shared/utils/fetchWrapper';

export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    status: string;
    token: string;
    data: {
        user: User;
    };
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    name?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'nova_user';

export const authService = {
    // Get stored token
    getToken: (): string | null => {
        return localStorage.getItem(TOKEN_KEY);
    },

    // Get stored user
    getUser: (): User | null => {
        const userStr = localStorage.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    // Store token and user
    setAuth: (token: string, user: User): void => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    // Clear auth data
    clearAuth: (): void => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    // Register new user
    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const response = await fetchWrapper<AuthResponse>('POST', '/auth/register', credentials);

        const { token, data } = response;
        authService.setAuth(token, data.user);

        return response;
    },

    // Login user
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await fetchWrapper<AuthResponse>('POST', '/auth/login', credentials);

        const { token, data } = response;
        authService.setAuth(token, data.user);

        return response;
    },

    // Logout user
    logout: async (): Promise<void> => {
        const token = authService.getToken();

        if (token) {
            try {
                await fetchWrapper<{ status: string; message: string }>('POST', '/auth/logout');
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        authService.clearAuth();
    },

    // Get current user from server
    getCurrentUser: async (): Promise<User> => {
        const response = await fetchWrapper<{ status: string; data: { user: User } }>('GET', '/auth/me');

        const user = response.data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        return user;
    },

    // Change password
    changePassword: async (data: ChangePasswordData): Promise<void> => {
        await fetchWrapper<{ status: string; message: string }>('POST', '/auth/change-password', data);
    },

    // Refresh token
    refreshToken: async (): Promise<string> => {
        const response = await fetchWrapper<{ status: string; token: string }>('POST', '/auth/refresh-token');

        const newToken = response.token;
        localStorage.setItem(TOKEN_KEY, newToken);

        return newToken;
    },

    // Check if user is authenticated
    isAuthenticated: (): boolean => {
        return !!authService.getToken();
    },
};

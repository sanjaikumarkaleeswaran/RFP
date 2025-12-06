import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { LoginCredentials, RegisterCredentials, ChangePasswordData, User } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Get current user query
    const {
        data: user,
        isLoading: isLoadingUser,
        error: userError,
    } = useQuery<User | null>({
        queryKey: ['currentUser'],
        queryFn: async () => {
            if (!authService.isAuthenticated()) {
                return null;
            }
            try {
                return await authService.getCurrentUser();
            } catch (error) {
                authService.logout();
                return null;
            }
        },
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
        onSuccess: (data) => {
            queryClient.setQueryData(['currentUser'], data.data.user);
            navigate('/dashboard');
        },
        onError: (error: any) => {
            console.error('Login failed:', error.response?.data?.message || error.message);
        },
    });

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: (credentials: RegisterCredentials) => authService.register(credentials),
        onSuccess: (data) => {
            queryClient.setQueryData(['currentUser'], data.data.user);
            navigate('/dashboard');
        },
        onError: (error: any) => {
            console.error('Registration failed:', error.response?.data?.message || error.message);
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            queryClient.setQueryData(['currentUser'], null);
            queryClient.clear();
            navigate('/login');
        },
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: (data: ChangePasswordData) => authService.changePassword(data),
        onSuccess: () => {
            console.log('Password changed successfully');
        },
        onError: (error: any) => {
            console.error('Password change failed:', error.response?.data?.message || error.message);
        },
    });

    // Refresh token mutation
    const refreshTokenMutation = useMutation({
        mutationFn: () => authService.refreshToken(),
        onError: () => {
            logoutMutation.mutate();
        },
    });

    return {
        // User data
        user,
        isAuthenticated: !!user,
        isLoadingUser,
        userError,

        // Login
        login: loginMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,

        // Register
        register: registerMutation.mutate,
        isRegistering: registerMutation.isPending,
        registerError: registerMutation.error,

        // Logout
        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,

        // Change password
        changePassword: changePasswordMutation.mutate,
        isChangingPassword: changePasswordMutation.isPending,
        changePasswordError: changePasswordMutation.error,

        // Refresh token
        refreshToken: refreshTokenMutation.mutate,
    };
}

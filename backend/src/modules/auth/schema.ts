import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Invalid email address')
            .transform(val => val.toLowerCase().trim()),
        password: z
            .string()
            .min(6, 'Password must be at least 6 characters'),
        name: z.string().trim().optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Invalid email address')
            .transform(val => val.toLowerCase().trim()),
        password: z
            .string()
            .min(1, 'Password is required'),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z
            .string()
            .min(1, 'Current password is required'),
        newPassword: z
            .string()
            .min(6, 'New password must be at least 6 characters'),
        confirmPassword: z
            .string()
            .min(1, 'Confirm password is required'),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];



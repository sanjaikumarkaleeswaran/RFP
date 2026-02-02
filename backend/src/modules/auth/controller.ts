import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { register, login, getMe, changePassword, refreshToken, forgotPassword, resetPassword } from './service';

export const registerHandler = catchAsync(async (req: Request, res: Response) => {
    const { user, token } = await register(req.body);

    res.status(201).json({
        status: 'success',
        token,
        data: { user },
    });
});

export const loginHandler = catchAsync(async (req: Request, res: Response) => {
    const { user, token } = await login(req.body);

    res.status(200).json({
        status: 'success',
        token,
        data: { user },
    });
});

export const logoutHandler = catchAsync(async (req: Request, res: Response) => {
    // Since we are using JWTs, the client just needs to delete the token.
    // We can't really invalidate it server-side without a blacklist/redis.
    // For now, just send a success response.
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
    });
});

export const getMeHandler = catchAsync(async (req: Request, res: Response) => {
    // req.user is set by authenticate middleware
    if (!req.user) {
        return res.status(401).json({
            status: 'fail',
            message: 'User not authenticated',
        });
    }

    const user = await getMe(req.user.id);

    res.status(200).json({
        status: 'success',
        data: { user },
    });
});

export const changePasswordHandler = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'fail',
            message: 'User not authenticated',
        });
    }

    const result = await changePassword(req.user.id, req.body);

    res.status(200).json({
        status: 'success',
        message: result.message,
    });
});

export const refreshTokenHandler = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'fail',
            message: 'User not authenticated',
        });
    }

    const { token } = await refreshToken(req.user.id);

    res.status(200).json({
        status: 'success',
        token,
    });
});

export const forgotPasswordHandler = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            status: 'fail',
            message: 'Email is required',
        });
    }

    const result = await forgotPassword(email);

    res.status(200).json({
        status: 'success',
        message: result.message,
    });
});

export const resetPasswordHandler = catchAsync(async (req: Request, res: Response) => {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
        return res.status(400).json({
            status: 'fail',
            message: 'Email, token, and new password are required',
        });
    }

    const result = await resetPassword(email, token, newPassword);

    res.status(200).json({
        status: 'success',
        message: result.message,
    });
});


/**
 * POST /emails/check-replies - Manually check for new replies from Gmail
 */
export const checkForReplies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        // Import Gmail API service
        const { gmailAPIService } = await import('../../common/services/gmail-api.service');

        // Check for new replies
        const replies = await gmailAPIService.checkReplies(new mongoose.Types.ObjectId(userId));

        res.status(200).json({
            success: true,
            message: `Found ${replies.length} new replies`,
            data: replies
        });
    } catch (error) {
        next(error);
    }
};

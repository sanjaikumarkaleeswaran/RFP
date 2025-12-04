import { Email, IEmail } from './model';

export class EmailService {
    async createEmail(data: Partial<IEmail>): Promise<IEmail> {
        const email = new Email(data);
        return await email.save();
    }

    async getEmails(filter: any = {}): Promise<IEmail[]> {
        return await Email.find(filter).sort({ receivedAt: -1, createdAt: -1 });
    }

    async getEmailById(id: string): Promise<IEmail | null> {
        return await Email.findById(id);
    }

    async attachToSpace(emailId: string, spaceId: string): Promise<IEmail | null> {
        return await Email.findByIdAndUpdate(emailId, { spaceId }, { new: true });
    }
}

export const emailService = new EmailService();

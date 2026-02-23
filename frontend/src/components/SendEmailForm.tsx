import React, { useState } from 'react';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { useEmail } from '../hooks/useEmail';

interface SendEmailFormProps {
    onSuccess?: () => void;
    defaultTo?: string;
    defaultSubject?: string;
    spaceId?: string;
}

export const SendEmailForm: React.FC<SendEmailFormProps> = ({
    onSuccess,
    defaultTo = '',
    defaultSubject = '',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    spaceId: _spaceId
}) => {
    const { sendEmail } = useEmail();
    const [formData, setFormData] = useState({
        to: defaultTo,
        subject: defaultSubject,
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.to || !formData.subject || !formData.message) {
            return;
        }

        sendEmail.mutate(
            {
                to: formData.to,
                subject: formData.subject,
                body: formData.message,
                html: formData.message.replace(/\n/g, '<br>')
            },
            {
                onSuccess: () => {
                    setFormData({ to: '', subject: '', message: '' });
                    onSuccess?.();
                }
            }
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Email</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                        To <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="to"
                        name="to"
                        value={formData.to}
                        onChange={handleChange}
                        placeholder="recipient@example.com"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Email subject"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Enter your message here..."
                        rows={8}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={sendEmail.isPending || !formData.to || !formData.subject || !formData.message}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                        {sendEmail.isPending ? (
                            <>
                                <FaSpinner className="animate-spin mr-2" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <FaPaperPlane className="mr-2" />
                                Send Email
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

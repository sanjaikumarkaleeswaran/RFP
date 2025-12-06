import React, { useState } from 'react';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { useEmail } from '../hooks/useEmail';

interface BulkEmailFormProps {
    onSuccess?: () => void;
}

export const BulkEmailForm: React.FC<BulkEmailFormProps> = ({ onSuccess }) => {
    const { sendBulkEmails } = useEmail();
    const [formData, setFormData] = useState({
        recipients: '',
        subject: '',
        message: ''
    });
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Parse recipients (comma or newline separated)
        const recipientList = formData.recipients
            .split(/[,\n]/)
            .map(email => email.trim())
            .filter(email => email && email.includes('@'));

        if (recipientList.length === 0) {
            return;
        }

        sendBulkEmails.mutate(
            {
                recipients: recipientList,
                subject: formData.subject,
                text: formData.message,
                html: formData.message.replace(/\n/g, '<br>')
            },
            {
                onSuccess: (data) => {
                    setResults(data);
                    setShowResults(true);
                    setFormData({ recipients: '', subject: '', message: '' });
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

    const recipientCount = formData.recipients
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email && email.includes('@')).length;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Bulk Emails</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 mb-1">
                        Recipients <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">
                            (Comma or newline separated)
                        </span>
                    </label>
                    <textarea
                        id="recipients"
                        name="recipients"
                        value={formData.recipients}
                        onChange={handleChange}
                        placeholder="email1@example.com, email2@example.com&#10;email3@example.com"
                        rows={5}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                    {recipientCount > 0 && (
                        <p className="mt-1 text-sm text-gray-600">
                            {recipientCount} valid {recipientCount === 1 ? 'recipient' : 'recipients'} detected
                        </p>
                    )}
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

                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        <strong>Note:</strong> Emails will be sent in batches of 50 to avoid rate limiting
                    </div>
                    <button
                        type="submit"
                        disabled={sendBulkEmails.isPending || recipientCount === 0 || !formData.subject || !formData.message}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                        {sendBulkEmails.isPending ? (
                            <>
                                <FaSpinner className="animate-spin mr-2" />
                                Sending {recipientCount} emails...
                            </>
                        ) : (
                            <>
                                <FaPaperPlane className="mr-2" />
                                Send to {recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Results Modal */}
            {showResults && results && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900">Bulk Email Results</h3>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                                    <div className="text-sm text-gray-600">Total</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">{results.sent}</div>
                                    <div className="text-sm text-gray-600">Sent</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                                    <div className="text-sm text-gray-600">Failed</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {results.results.map((result: any, index: number) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border ${result.success
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-sm">{result.recipient}</span>
                                            <span
                                                className={`text-xs font-semibold ${result.success ? 'text-green-600' : 'text-red-600'
                                                    }`}
                                            >
                                                {result.success ? '✓ Sent' : '✗ Failed'}
                                            </span>
                                        </div>
                                        {result.error && (
                                            <p className="text-xs text-red-600 mt-1">{result.error}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowResults(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

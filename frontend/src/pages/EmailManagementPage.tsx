import React, { useState } from 'react';
import { GmailConnection } from '../components/GmailConnection';
import { SendEmailForm } from '../components/SendEmailForm';
import { BulkEmailForm } from '../components/BulkEmailForm';
import { RepliesList } from '../components/RepliesList';
import { FaEnvelope, FaUsers, FaInbox } from 'react-icons/fa';

export const EmailManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'replies'>('single');

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Management</h1>
                    <p className="text-gray-600">
                        Send emails, manage bulk campaigns, and track replies
                    </p>
                </div>

                {/* Gmail Connection */}
                <div className="mb-8">
                    <GmailConnection />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('single')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'single'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                <FaEnvelope className="mr-2" />
                                Send Email
                            </button>
                            <button
                                onClick={() => setActiveTab('bulk')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'bulk'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                <FaUsers className="mr-2" />
                                Bulk Send
                            </button>
                            <button
                                onClick={() => setActiveTab('replies')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'replies'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                <FaInbox className="mr-2" />
                                Replies
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 gap-6">
                    {activeTab === 'single' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SendEmailForm />
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    How to Send Emails
                                </h3>
                                <div className="space-y-4 text-sm text-gray-700">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Via SMTP</h4>
                                        <p>
                                            Configure SMTP settings in your .env file. Supports Gmail SMTP
                                            and custom SMTP servers. Emails are sent immediately.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Via Gmail API</h4>
                                        <p>
                                            Connect your Gmail account above. Emails will be sent from your
                                            Gmail and appear in your Sent folder. Replies are automatically
                                            detected.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-blue-800">
                                            <strong>Tip:</strong> Use Gmail API for better reply tracking
                                            and thread management.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bulk' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BulkEmailForm />
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Bulk Email Guidelines
                                </h3>
                                <div className="space-y-4 text-sm text-gray-700">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            Recipient Format
                                        </h4>
                                        <p className="mb-2">Enter email addresses separated by:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Commas: email1@example.com, email2@example.com</li>
                                            <li>New lines: One email per line</li>
                                            <li>Mixed: Any combination of the above</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Batching</h4>
                                        <p>
                                            Emails are sent in batches of 50 to avoid rate limiting. Large
                                            campaigns may take a few minutes to complete.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            Delivery Status
                                        </h4>
                                        <p>
                                            After sending, you'll see a detailed report showing which emails
                                            were sent successfully and which failed.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-yellow-800">
                                            <strong>Warning:</strong> Ensure you have permission to email
                                            all recipients. Unsolicited bulk emails may violate spam laws.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'replies' && (
                        <div>
                            <RepliesList />
                            <div className="mt-6 bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    About Reply Detection
                                </h3>
                                <div className="space-y-4 text-sm text-gray-700">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            Automatic Detection
                                        </h4>
                                        <p>
                                            When Gmail is connected, the system automatically checks for new
                                            replies every 10 seconds. Replies are matched to original emails
                                            using thread IDs and email headers.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Manual Check</h4>
                                        <p>
                                            Click "Check Gmail" to manually fetch new replies. This is useful
                                            if you want to see replies immediately without waiting for the
                                            auto-refresh.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            Reply Matching
                                        </h4>
                                        <p>Replies are matched using:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                                            <li>Gmail thread ID (most reliable)</li>
                                            <li>In-Reply-To email header</li>
                                            <li>Subject line matching (Re: ...)</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-green-800">
                                            <strong>Note:</strong> Only emails sent via Gmail API can have
                                            replies automatically detected. SMTP emails don't support this
                                            feature.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

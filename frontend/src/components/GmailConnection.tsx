import React, { useState } from 'react';
import { FaGoogle, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { useGmailStatus, useEmail } from '../hooks/useEmail';
import { emailService } from '../services/email.service';
import { toast } from 'sonner';

export const GmailConnection: React.FC = () => {
    const { data: gmailStatus, isLoading } = useGmailStatus();
    const { disconnectGmail } = useEmail();
    const [connecting, setConnecting] = useState(false);

    const handleConnect = async () => {
        try {
            setConnecting(true);
            const { authUrl } = await emailService.getGmailAuthUrl();

            // Open OAuth URL in new window
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            window.open(
                authUrl,
                'Gmail OAuth',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            toast.success('Please authorize Gmail in the popup window');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to get Gmail auth URL');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = () => {
        if (window.confirm('Are you sure you want to disconnect Gmail?')) {
            disconnectGmail.mutate();
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-6 bg-white rounded-lg shadow">
                <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                <span className="ml-3 text-gray-600">Checking Gmail status...</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                        <FaGoogle className="text-red-600 text-2xl" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Gmail Integration</h3>
                        {gmailStatus?.connected ? (
                            <div className="flex items-center space-x-2 mt-1">
                                <FaCheckCircle className="text-green-600" />
                                <span className="text-sm text-gray-600">
                                    Connected as <span className="font-medium">{gmailStatus.email}</span>
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 mt-1">
                                <FaTimesCircle className="text-gray-400" />
                                <span className="text-sm text-gray-600">Not connected</span>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    {gmailStatus?.connected ? (
                        <button
                            onClick={handleDisconnect}
                            disabled={disconnectGmail.isPending}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {disconnectGmail.isPending ? (
                                <span className="flex items-center">
                                    <FaSpinner className="animate-spin mr-2" />
                                    Disconnecting...
                                </span>
                            ) : (
                                'Disconnect'
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                            {connecting ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <FaGoogle className="mr-2" />
                                    Connect Gmail
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {gmailStatus?.connected && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                        <strong>Gmail connected!</strong> You can now:
                    </p>
                    <ul className="mt-2 text-sm text-green-700 list-disc list-inside space-y-1">
                        <li>Send emails via Gmail API</li>
                        <li>Automatically detect replies to your sent emails</li>
                        <li>Track email threads and conversations</li>
                    </ul>
                </div>
            )}

            {!gmailStatus?.connected && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        Connect your Gmail account to enable:
                    </p>
                    <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                        <li>Automatic reply detection</li>
                        <li>Email thread tracking</li>
                        <li>Send emails directly from your Gmail</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

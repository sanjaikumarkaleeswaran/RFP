import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

export const GmailConnectedPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const success = searchParams.get('success') === 'true';
    const error = searchParams.get('error');

    useEffect(() => {
        // Auto-redirect after 3 seconds
        const timer = setTimeout(() => {
            navigate('/inbox');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
                {success ? (
                    <>
                        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                            <FaCheckCircle className="text-green-600 text-3xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                            Gmail Connected!
                        </h2>
                        <p className="text-gray-600 text-center mb-6">
                            Your Gmail account has been successfully connected. You can now view your inbox
                            and import emails to spaces.
                        </p>
                        <div className="flex items-center justify-center text-sm text-gray-500">
                            <FaSpinner className="animate-spin mr-2" />
                            Redirecting to Inbox...
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                            <FaTimesCircle className="text-red-600 text-3xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                            Connection Failed
                        </h2>
                        <p className="text-gray-600 text-center mb-4">
                            Failed to connect your Gmail account.
                        </p>
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-red-800">{decodeURIComponent(error)}</p>
                            </div>
                        )}
                        <div className="flex items-center justify-center text-sm text-gray-500">
                            <FaSpinner className="animate-spin mr-2" />
                            Redirecting back...
                        </div>
                    </>
                )}

                <button
                    onClick={() => navigate('/inbox')}
                    className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Go to Inbox
                </button>
            </div>
        </div>
    );
};

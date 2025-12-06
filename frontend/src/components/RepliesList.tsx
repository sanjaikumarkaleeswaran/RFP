import React from 'react';
import { FaEnvelope, FaReply, FaSpinner, FaSync } from 'react-icons/fa';
import { useReplies, useEmail } from '../hooks/useEmail';
import { formatDistanceToNow } from 'date-fns';

interface RepliesListProps {
    spaceId?: string;
}

export const RepliesList: React.FC<RepliesListProps> = ({ spaceId }) => {
    const { data, isLoading, refetch } = useReplies(spaceId);
    const { checkReplies } = useEmail();

    const handleCheckReplies = () => {
        checkReplies.mutate();
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-center py-8">
                    <FaSpinner className="animate-spin text-blue-600 text-2xl mr-3" />
                    <span className="text-gray-600">Loading replies...</span>
                </div>
            </div>
        );
    }

    const replies = data?.replies || [];

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <FaReply className="text-blue-600 text-xl" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Email Replies ({replies.length})
                        </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center"
                        >
                            <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={handleCheckReplies}
                            disabled={checkReplies.isPending}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                        >
                            {checkReplies.isPending ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <FaEnvelope className="mr-2" />
                                    Check Gmail
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-200">
                {replies.length === 0 ? (
                    <div className="p-8 text-center">
                        <FaEnvelope className="mx-auto text-gray-400 text-4xl mb-3" />
                        <h4 className="text-lg font-medium text-gray-900 mb-1">No replies yet</h4>
                        <p className="text-gray-600 text-sm">
                            Replies to your sent emails will appear here automatically
                        </p>
                        <button
                            onClick={handleCheckReplies}
                            disabled={checkReplies.isPending}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center"
                        >
                            {checkReplies.isPending ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <FaEnvelope className="mr-2" />
                                    Check for Replies
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    replies.map((reply: any) => (
                        <div key={reply.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                                        <FaReply className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">
                                            {reply.from.name || reply.from.email}
                                        </h4>
                                        <p className="text-sm text-gray-600">{reply.from.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(reply.receivedAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>

                            <div className="ml-13">
                                <h5 className="font-medium text-gray-900 mb-2">{reply.subject}</h5>
                                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    {reply.bodyPlain ? (
                                        <pre className="whitespace-pre-wrap font-sans">
                                            {reply.bodyPlain.substring(0, 300)}
                                            {reply.bodyPlain.length > 300 && '...'}
                                        </pre>
                                    ) : (
                                        <div dangerouslySetInnerHTML={{
                                            __html: reply.bodyHtml?.substring(0, 300) + (reply.bodyHtml?.length > 300 ? '...' : '')
                                        }} />
                                    )}
                                </div>

                                {reply.threadId && (
                                    <div className="mt-2 flex items-center space-x-2">
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                            Thread: {reply.threadId.substring(0, 12)}...
                                        </span>
                                        {reply.isReply && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                ✓ Reply Detected
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {replies.length > 0 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                        Auto-refreshing every 10 seconds • Last updated: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            )}
        </div>
    );
};

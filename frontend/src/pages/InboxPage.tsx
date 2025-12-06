import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Mail,
    ChevronLeft,
    ChevronRight,
    Download,
    X,
    Check,
    Paperclip,
    Eye,
    FileText
} from 'lucide-react';
import { emailService, type Email } from '../services/email.service';
import { spaceService } from '../services/space.service';
import { vendorService } from '../services/vendor.service';
import type { Space, Vendor } from '../types';

export function InboxPage() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [gmailConnected, setGmailConnected] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Pagination
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();
    const [prevPageTokens, setPrevPageTokens] = useState<string[]>([]);

    // Import modal
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [selectedSpace, setSelectedSpace] = useState('');

    // Vendor mapping modal
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendor, setSelectedVendor] = useState('');

    // Attachments modal
    const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
    const [selectedEmailForAttachments, setSelectedEmailForAttachments] = useState<Email | null>(null);

    // Check Gmail connection status
    useEffect(() => {
        checkGmailStatus();
    }, []);

    const checkGmailStatus = async () => {
        try {
            setCheckingStatus(true);
            const response = await emailService.getGmailStatus();
            const isConnected = response.connected || false;
            setGmailConnected(isConnected);

            // If connected, load inbox immediately
            if (isConnected) {
                loadInbox();
            }
        } catch (error: any) {
            console.error('Gmail status check error:', error);
            setGmailConnected(false);
        } finally {
            setCheckingStatus(false);
        }
    };

    const loadInbox = async (pageToken?: string) => {
        try {
            setLoading(true);
            const response = await emailService.getGmailInbox(pageToken, 20);
            setEmails(response.data);
            setNextPageToken(response.nextPageToken);
        } catch (error: any) {
            console.error('Load inbox error:', error);
            toast.error(error.message || 'Failed to load inbox');

            // If error is due to no Gmail connection, update status
            if (error.message?.includes('not connected') || error.message?.includes('not authenticated')) {
                setGmailConnected(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGmail = async () => {
        try {
            const response = await emailService.getGmailAuthUrl();
            window.location.href = response.authUrl;
        } catch (error: any) {
            toast.error(error.message || 'Failed to get Gmail auth URL');
        }
    };

    const handleNextPage = () => {
        if (nextPageToken) {
            setPrevPageTokens([...prevPageTokens, nextPageToken]);
            loadInbox(nextPageToken);
        }
    };

    const handlePrevPage = () => {
        const newPrevTokens = [...prevPageTokens];
        const prevToken = newPrevTokens.pop();
        setPrevPageTokens(newPrevTokens);
        loadInbox(prevToken);
    };

    const handleExport = async (email: Email) => {
        setSelectedEmail(email);
        setShowImportModal(true);
        loadSpaces();
    };

    const loadSpaces = async () => {
        try {
            const allSpaces = await spaceService.getAll();
            setSpaces(allSpaces);
        } catch (error: any) {
            toast.error('Failed to load spaces');
        }
    };

    const handleImportSubmit = async () => {
        if (!selectedEmail || !selectedSpace) {
            toast.error('Please select a space');
            return;
        }

        try {
            await emailService.importToSpace(selectedEmail.gmailMessageId!, selectedSpace);
            toast.success('Email imported to space successfully');
            setShowImportModal(false);
            setSelectedEmail(null);
            setSelectedSpace('');
            loadInbox(); // Refresh to update import status
        } catch (error: any) {
            toast.error(error.message || 'Failed to import email');
        }
    };

    const handleMapVendor = async (email: Email) => {
        if (!email.isImported) {
            toast.error('Please import email to a space first');
            return;
        }

        setSelectedEmail(email);
        setShowVendorModal(true);
        loadVendors();
    };

    const loadVendors = async () => {
        try {
            const allVendors = await vendorService.getAll();
            setVendors(allVendors);
        } catch (error: any) {
            toast.error('Failed to load vendors');
        }
    };

    const handleVendorSubmit = async () => {
        if (!selectedEmail || !selectedVendor) {
            toast.error('Please select a vendor');
            return;
        }

        try {
            await emailService.mapToVendor(selectedEmail.gmailMessageId!, selectedVendor);
            toast.success('Email mapped to vendor successfully');
            setShowVendorModal(false);
            setSelectedEmail(null);
            setSelectedVendor('');
            loadInbox(); // Refresh
        } catch (error: any) {
            toast.error(error.message || 'Failed to map vendor');
        }
    };

    const handleViewAttachments = (email: Email) => {
        setSelectedEmailForAttachments(email);
        setShowAttachmentsModal(true);
    };

    const handleDownloadAttachment = async (emailId: string, attachmentId: string, filename: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/emails/${emailId}/attachments/${attachmentId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download attachment');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Attachment downloaded successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to download attachment');
        }
    };

    const handlePreviewAttachment = async (emailId: string, attachmentId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/emails/${emailId}/attachments/${attachmentId}/preview`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to preview attachment');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');

            // Clean up after a delay
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error: any) {
            toast.error(error.message || 'Failed to preview attachment');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (days < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (checkingStatus) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Checking Gmail connection...</p>
                </div>
            </div>
        );
    }

    if (!gmailConnected) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                    <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Gmail</h2>
                    <p className="text-gray-600 mb-6">
                        Connect your Gmail account to start receiving and managing emails
                    </p>
                    <button
                        onClick={handleConnectGmail}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Connect Gmail Account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b bg-white px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                            <p className="mt-2 text-sm text-gray-600">Loading emails...</p>
                        </div>
                    </div>
                ) : emails.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">No emails found</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y">
                        {emails.map((email) => (
                            <div
                                key={email.id}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
                            >
                                {/* Sender */}
                                <div className="w-48 flex-shrink-0">
                                    <p className="text-sm truncate font-medium">
                                        {email.from.name || email.from.email}
                                    </p>
                                </div>

                                {/* Subject & Snippet */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate font-medium">
                                        {email.subject || '(No Subject)'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {email.bodyPlain}
                                    </p>
                                </div>

                                {/* Attachment Indicator */}
                                {email.attachments && email.attachments.length > 0 && (
                                    <button
                                        onClick={() => handleViewAttachments(email)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                                        title="View attachments"
                                    >
                                        <Paperclip className="h-3 w-3" />
                                        <span>{email.attachments.length}</span>
                                    </button>
                                )}

                                {/* Imported Badge */}
                                {email.isImported && (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                        Imported
                                    </span>
                                )}

                                {/* Date */}
                                <div className="w-20 text-right">
                                    <p className="text-xs text-gray-500">
                                        {email.date && formatDate(email.date)}
                                    </p>
                                </div>

                                {/* Export Button */}
                                <button
                                    onClick={() => handleExport(email)}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="Import to Space"
                                >
                                    <Download className="h-4 w-4 text-gray-600" />
                                </button>

                                {/* Map Vendor Button */}
                                {email.isImported && (
                                    <button
                                        onClick={() => handleMapVendor(email)}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Map to Vendor"
                                    >
                                        <Check className="h-4 w-4 text-gray-600" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="border-t bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {emails.length} emails
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={prevPageTokens.length === 0}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={!nextPageToken}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Import Email to Space</h3>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                From: {selectedEmail?.from.email}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                Subject: {selectedEmail?.subject || '(No Subject)'}
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Space
                            </label>
                            <select
                                value={selectedSpace}
                                onChange={(e) => setSelectedSpace(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- Select a Space --</option>
                                {spaces.map((space) => (
                                    <option key={space.id} value={space.id}>
                                        {space.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImportSubmit}
                                disabled={!selectedSpace}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vendor Mapping Modal */}
            {showVendorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Map Email to Vendor</h3>
                            <button
                                onClick={() => setShowVendorModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-4">
                                From: {selectedEmail?.from.email}
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Vendor
                            </label>
                            <select
                                value={selectedVendor}
                                onChange={(e) => setSelectedVendor(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- Select a Vendor --</option>
                                {vendors.map((vendor) => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.name} ({vendor.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowVendorModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVendorSubmit}
                                disabled={!selectedVendor}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Map Vendor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachments Modal */}
            {showAttachmentsModal && selectedEmailForAttachments && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Email Attachments</h3>
                            <button
                                onClick={() => setShowAttachmentsModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4 pb-4 border-b">
                            <p className="text-sm text-gray-600 mb-1">
                                <strong>From:</strong> {selectedEmailForAttachments.from.email}
                            </p>
                            <p className="text-sm text-gray-600">
                                <strong>Subject:</strong> {selectedEmailForAttachments.subject || '(No Subject)'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {selectedEmailForAttachments.attachments?.map((attachment: any, index: number) => {
                                const isPreviewable = [
                                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                                    'application/pdf',
                                    'text/plain', 'text/html', 'text/csv'
                                ].includes(attachment.mimeType);

                                return (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText className="h-8 w-8 text-gray-400 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {attachment.filename}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(attachment.size)} • {attachment.mimeType}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            {isPreviewable && attachment.size < 5 * 1024 * 1024 && (
                                                <button
                                                    onClick={() => handlePreviewAttachment(selectedEmailForAttachments.id, attachment.attachmentId)}
                                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                                    title="Preview"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Preview
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDownloadAttachment(selectedEmailForAttachments.id, attachment.attachmentId, attachment.filename)}
                                                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                                                title="Download"
                                            >
                                                <Download className="h-4 w-4" />
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {selectedEmailForAttachments.attachments?.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Paperclip className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>No attachments found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

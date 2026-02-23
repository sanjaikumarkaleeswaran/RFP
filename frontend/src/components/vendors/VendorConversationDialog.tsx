import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Mail, MailOpen, Reply, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { emailService, type Email } from '../../services/email.service';
import { toast } from 'sonner';

interface VendorConversationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vendorId: string;
    vendorName: string;
    vendorEmail: string;
    spaceId?: string;
    initialReplyContent?: string; // Pre-filled reply content (e.g., acceptance message)
}

export function VendorConversationDialog({
    open,
    onOpenChange,
    vendorId,
    vendorName,
    vendorEmail,
    spaceId,
    initialReplyContent
}: VendorConversationDialogProps) {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [showReply, setShowReply] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [sending, setSending] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const refreshIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (open && vendorId) {
            loadConversation();
        }
    }, [open, vendorId, spaceId]);

    // Set initial reply content if provided
    useEffect(() => {
        if (open && initialReplyContent) {
            setReplyContent(initialReplyContent);
            setShowReply(true);
        }
    }, [open, initialReplyContent]);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        if (open && autoRefresh) {
            refreshIntervalRef.current = setInterval(() => {
                loadConversation(true); // Silent refresh
            }, 10000);

            return () => {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                }
            };
        }
    }, [open, autoRefresh, vendorId, spaceId]);

    const loadConversation = async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            const response = await emailService.getVendorEmails(vendorId);
            let filteredEmails = response.data || [];

            // Filter by space if provided
            if (spaceId) {
                // First, get all emails that directly belong to this space
                const spaceEmails = filteredEmails.filter((email: any) =>
                    email.spaceId === spaceId || email.importedToSpaceId === spaceId
                );

                // Get all thread IDs from space emails
                const spaceThreadIds = new Set(
                    spaceEmails.map((email: any) => email.threadId).filter(Boolean)
                );

                // Include all emails that are either:
                // 1. Directly belong to this space (spaceId or importedToSpaceId)
                // 2. Part of a thread that belongs to this space
                filteredEmails = filteredEmails.filter((email: any) =>
                    email.spaceId === spaceId ||
                    email.importedToSpaceId === spaceId ||
                    (email.threadId && spaceThreadIds.has(email.threadId))
                );
            }

            setEmails(filteredEmails);

            // Auto-select first email if none selected
            if (!selectedEmail && filteredEmails.length > 0) {
                setSelectedEmail(filteredEmails[0]);
            }
        } catch (error: any) {
            if (!silent) {
                toast.error('Failed to load conversation');
                console.error('Error loading conversation:', error);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleDownloadAttachment = async (emailId: string, attachmentId: string, filename: string) => {
        try {
            const token = localStorage.getItem('accessToken');


            const response = await fetch(`${API_BASE_URL}/emails/${emailId}/attachments/${attachmentId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download attachment');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Attachment downloaded');
        } catch (error) {
            toast.error('Failed to download attachment');
            console.error('Download error:', error);
        }
    };

    const handlePreviewAttachment = async (emailId: string, attachmentId: string, _filename: string, _mimeType: string) => {
        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`${API_BASE_URL}/emails/${emailId}/attachments/${attachmentId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load attachment');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Open in new tab for preview
            window.open(url, '_blank');

            // Clean up after a delay
            setTimeout(() => URL.revokeObjectURL(url), 100);

            toast.success('Opening preview...');
        } catch (error) {
            toast.error('Failed to preview attachment');
            console.error('Preview error:', error);
        }
    };


    const handleReply = async () => {
        if (!replyContent.trim()) {
            toast.error('Please enter a reply message');
            return;
        }

        if (!selectedEmail) {
            toast.error('No email selected');
            return;
        }

        try {
            setSending(true);

            // Get the correct message ID for threading
            const messageIdForReply = selectedEmail.messageId || selectedEmail.gmailMessageId;
            const threadIdForReply = selectedEmail.threadId;

            // Determine who to reply to
            let replyTo = vendorEmail;
            if (selectedEmail.direction === 'inbound') {
                replyTo = selectedEmail.from.email;
            } else if (selectedEmail.direction === 'outbound' && selectedEmail.to && selectedEmail.to.length > 0) {
                replyTo = selectedEmail.to[0].email;
            }

            // Format the date for the quoted message
            const quotedDate = new Date(selectedEmail.createdAt || selectedEmail.receivedAt || '').toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Create quoted text (like Gmail does)
            const quotedText = `<br><br><div style="margin-top:10px;border-top:1px solid #ccc;padding-top:10px"><div style="color:#666;font-size:12px">On ${quotedDate}, <${selectedEmail.from.email}> wrote:</div><blockquote style="margin:10px 0 0 0;padding-left:10px;border-left:2px solid #ccc;color:#666">${selectedEmail.bodyHtml || selectedEmail.bodyPlain || ''}</blockquote></div>`;

            // Combine new reply with quoted text
            const fullBody = `<div>${replyContent}</div>${quotedText}`;

            console.log('Sending reply with:', {
                to: replyTo,
                subject: selectedEmail.subject,
                messageId: messageIdForReply,
                threadId: threadIdForReply,
                direction: selectedEmail.direction
            });

            // Send reply via Gmail API with vendor and space context
            const result = await emailService.sendViaGmail({
                to: replyTo,
                subject: selectedEmail.subject?.startsWith('Re:')
                    ? selectedEmail.subject
                    : `Re: ${selectedEmail.subject || 'Your message'}`,
                body: fullBody,
                inReplyTo: messageIdForReply,
                threadId: threadIdForReply,
                vendorId: vendorId,
                spaceId: spaceId
            });

            console.log('Reply sent result:', result);

            toast.success('Reply sent successfully!');
            setReplyContent('');
            setShowReply(false);

            // Reload conversation immediately to show new reply
            await loadConversation();
        } catch (error: any) {
            toast.error(error.message || 'Failed to send reply');
            console.error('Error sending reply:', error);
        } finally {
            setSending(false);
        }
    };

    const formatDate = (date?: string | Date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const checkForReplies = async () => {
        try {
            setLoading(true);
            const response = await emailService.checkForReplies();
            if (response.data && response.data.length > 0) {
                toast.success(`Found ${response.data.length} new replies!`);
                await loadConversation();
            } else {
                toast.info('No new replies found');
            }
        } catch (error: any) {
            toast.error('Failed to check for replies');
            console.error('Error checking replies:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                Email Conversation with {vendorName}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">{vendorEmail}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={checkForReplies}
                                disabled={loading}
                                title="Check Gmail for new replies"
                            >
                                <Mail className="h-4 w-4 mr-1" />
                                Check Replies
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => loadConversation()}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="rounded"
                                />
                                <span>Auto-refresh</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex gap-4">
                    {/* Email List */}
                    <div className="w-1/3 border-r pr-4 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-center">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                                    <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                                </div>
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No emails found</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {emails.map((email) => (
                                    <div
                                        key={email.id}
                                        onClick={() => {
                                            setSelectedEmail(email);
                                            setShowReply(false);
                                        }}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedEmail?.id === email.id
                                            ? 'bg-primary/10 border-2 border-primary'
                                            : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {email.direction === 'outbound' ? (
                                                <MailOpen className="w-4 h-4 text-green-600 mt-0.5" />
                                            ) : (
                                                <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {email.subject || '(No Subject)'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {email.direction === 'outbound' ? 'Sent' : 'Received'} •{' '}
                                                    {formatDate(email.createdAt || email.receivedAt)}
                                                </p>
                                                {email.bodyPlain && (
                                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                                        {email.bodyPlain.substring(0, 50)}...
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Email Content */}
                    <div className="flex-1 overflow-y-auto">
                        {selectedEmail ? (
                            <div className="space-y-4">
                                <div className="border-b pb-4">
                                    <h3 className="text-lg font-semibold">{selectedEmail.subject || '(No Subject)'}</h3>
                                    <div className="mt-2 space-y-1 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">From:</span>
                                            <span className="text-muted-foreground">
                                                {selectedEmail.from.name || selectedEmail.from.email}
                                                {selectedEmail.from.name && (
                                                    <span className="text-xs ml-1">({selectedEmail.from.email})</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">To:</span>
                                            <span className="text-muted-foreground">
                                                {selectedEmail.to.map(t => t.email).join(', ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Date:</span>
                                            <span className="text-muted-foreground">
                                                {formatDate(selectedEmail.createdAt || selectedEmail.receivedAt)}
                                            </span>
                                        </div>
                                        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Attachments:</span>
                                                <span className="text-muted-foreground">
                                                    {selectedEmail.attachments.length} file(s)
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="prose prose-sm max-w-none">
                                    {selectedEmail.bodyHtml ? (
                                        <div
                                            dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                                            className="text-sm"
                                        />
                                    ) : (
                                        <pre className="whitespace-pre-wrap text-sm font-sans">
                                            {selectedEmail.bodyPlain || '(No content)'}
                                        </pre>
                                    )}
                                </div>

                                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium mb-3">Attachments ({selectedEmail.attachments.length})</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedEmail.attachments.map((attachment, idx) => {
                                                const isImage = attachment.mimeType?.startsWith('image/');
                                                const isPdf = attachment.mimeType === 'application/pdf';
                                                const isDoc = attachment.mimeType?.includes('word') ||
                                                    attachment.mimeType?.includes('document');
                                                const isExcel = attachment.mimeType?.includes('sheet') ||
                                                    attachment.mimeType?.includes('excel');


                                                return (
                                                    <div
                                                        key={idx}
                                                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {/* Icon */}
                                                            <div className="flex-shrink-0">
                                                                {isImage ? (
                                                                    <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                                                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </div>
                                                                ) : isPdf ? (
                                                                    <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                                                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </div>
                                                                ) : isDoc ? (
                                                                    <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                                                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                    </div>
                                                                ) : isExcel ? (
                                                                    <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                                                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                                                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* File Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">
                                                                    {attachment.filename}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                                                    {attachment.mimeType && ` • ${attachment.mimeType.split('/')[1]?.toUpperCase()}`}
                                                                </p>

                                                                {/* Action Buttons */}
                                                                <div className="flex gap-2 mt-2">
                                                                    {isImage && attachment.attachmentId && (
                                                                        <button
                                                                            onClick={() => handlePreviewAttachment(selectedEmail.id, attachment.attachmentId!, attachment.filename, attachment.mimeType || 'image/png')}
                                                                            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                                                                        >
                                                                            👁️ Preview
                                                                        </button>
                                                                    )}
                                                                    {isPdf && attachment.attachmentId && (
                                                                        <button
                                                                            onClick={() => handlePreviewAttachment(selectedEmail.id, attachment.attachmentId!, attachment.filename, attachment.mimeType || 'application/pdf')}
                                                                            className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors cursor-pointer"
                                                                        >
                                                                            📄 View PDF
                                                                        </button>
                                                                    )}
                                                                    {attachment.attachmentId && (
                                                                        <button
                                                                            onClick={() => handleDownloadAttachment(selectedEmail.id, attachment.attachmentId!, attachment.filename)}
                                                                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                                                                        >
                                                                            ⬇️ Download
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Reply Section */}
                                <div className="border-t pt-4 mt-4">
                                    {!showReply ? (
                                        <Button
                                            onClick={() => setShowReply(true)}
                                            className="w-full"
                                        >
                                            <Reply className="w-4 h-4 mr-2" />
                                            Reply to this email
                                        </Button>
                                    ) : (
                                        <div className="space-y-3">
                                            <h4 className="font-medium">Reply to {vendorName}</h4>
                                            <Textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="Type your reply here..."
                                                className="min-h-[150px]"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={handleReply}
                                                    disabled={sending || !replyContent.trim()}
                                                >
                                                    {sending ? 'Sending...' : 'Send Reply'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setShowReply(false);
                                                        setReplyContent('');
                                                    }}
                                                    disabled={sending}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                    <MailOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Select an email to view its content</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

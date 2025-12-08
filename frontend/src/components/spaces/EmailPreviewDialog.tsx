import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';

interface EmailPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject: string;
    content: string;
    recipients: Array<{ name: string; email: string }>;
    onSend?: () => void;
}

export function EmailPreviewDialog({
    open,
    onOpenChange,
    subject,
    content,
    recipients,
    onSend
}: EmailPreviewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Email Preview</DialogTitle>
                    <DialogDescription>
                        Review the email before sending to {recipients.length} vendor(s)
                        {recipients.length > 1 && (
                            <span className="block mt-1 text-xs text-blue-600">
                                Note: Each vendor will receive a personalized version with their name and company
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Recipients */}
                    <div>
                        <label className="text-sm font-medium">To:</label>
                        <div className="mt-1 flex flex-wrap gap-2">
                            {recipients.map((recipient, idx) => (
                                <div key={idx} className="text-sm bg-secondary px-2 py-1 rounded">
                                    {recipient.name} &lt;{recipient.email}&gt;
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="text-sm font-medium">Subject:</label>
                        <div className="mt-1 p-2 bg-muted rounded text-sm">
                            {subject}
                        </div>
                    </div>

                    {/* Email Content */}
                    <div>
                        <label className="text-sm font-medium">Message:</label>
                        <div className="mt-1 p-4 bg-muted rounded whitespace-pre-wrap text-sm border">
                            {content}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            onSend?.();
                            onOpenChange(false);
                        }}>
                            Send Email
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

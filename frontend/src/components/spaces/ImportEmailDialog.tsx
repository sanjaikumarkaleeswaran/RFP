import { useState } from 'react';
import { API_BASE_URL } from '@/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import type { Vendor } from '../../types';

interface ImportEmailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spaceId: string;
    vendors?: Vendor[];
    onSuccess?: () => void;
}

export function ImportEmailDialog({
    open,
    onOpenChange,
    spaceId,
    vendors,
    onSuccess
}: ImportEmailDialogProps) {
    const [fromEmail, setFromEmail] = useState('');
    const [fromName, setFromName] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async () => {
        if (!fromEmail || !content) {
            toast.error('From email and content are required');
            return;
        }

        setIsImporting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/spaces/${spaceId}/import-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: {
                        email: fromEmail,
                        name: fromName || undefined
                    },
                    subject: subject || undefined,
                    content,
                    vendorId: selectedVendorId || undefined
                })
            });

            if (!response.ok) {
                throw new Error('Failed to import email');
            }

            await response.json();
            toast.success('Email imported and proposal created successfully!');

            // Reset form
            setFromEmail('');
            setFromName('');
            setSubject('');
            setContent('');
            setSelectedVendorId('');

            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to import email. Please try again.');
            console.error('Import email error:', error);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Manual Email</DialogTitle>
                    <DialogDescription>
                        Import a vendor response email that was received outside the system
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* From Email */}
                    <div className="space-y-2">
                        <Label htmlFor="fromEmail">From Email *</Label>
                        <Input
                            id="fromEmail"
                            type="email"
                            placeholder="vendor@company.com"
                            value={fromEmail}
                            onChange={(e) => setFromEmail(e.target.value)}
                        />
                    </div>

                    {/* From Name */}
                    <div className="space-y-2">
                        <Label htmlFor="fromName">From Name (Optional)</Label>
                        <Input
                            id="fromName"
                            placeholder="John Doe"
                            value={fromName}
                            onChange={(e) => setFromName(e.target.value)}
                        />
                    </div>

                    {/* Vendor Selection */}
                    {vendors && vendors.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="vendor">Vendor (Optional - will auto-detect if not selected)</Label>
                            <select
                                id="vendor"
                                className="w-full p-2 border rounded-md"
                                value={selectedVendorId}
                                onChange={(e) => setSelectedVendorId(e.target.value)}
                            >
                                <option value="">Auto-detect from email</option>
                                {vendors.map(vendor => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.name} - {vendor.companyName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject (Optional)</Label>
                        <Input
                            id="subject"
                            placeholder="Re: RFP Response"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    {/* Email Content */}
                    <div className="space-y-2">
                        <Label htmlFor="content">Email Content *</Label>
                        <Textarea
                            id="content"
                            placeholder="Paste the vendor's email response here..."
                            className="min-h-[300px] font-mono text-sm"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            AI will automatically extract pricing, terms, delivery, and other details
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={isImporting || !fromEmail || !content}
                        >
                            {isImporting ? 'Importing...' : 'Import & Process'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

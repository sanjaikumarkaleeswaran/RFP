import { useSpace, useSpaceActions, useSpaceVendors } from '@/hooks';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Email, VendorEmailStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Eye,
    Send,
    Mail,
    MailCheck,
    Inbox,
    FileText,
    Upload,
    BarChart3,
    X,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { emailService } from '@/services/email.service';
import { fetchWrapper } from '@/shared/utils/fetchWrapper';
import { EmailPreviewDialog } from '@/components/spaces/EmailPreviewDialog';
import { ImportEmailDialog } from '@/components/spaces/ImportEmailDialog';
import { VendorConversationDialog } from '@/components/vendors/VendorConversationDialog';



export function SpaceDetailPage() {
    const { spaceId } = useParams();
    const { data: space, isLoading } = useSpace(spaceId!);
    const { data: vendors } = useSpaceVendors(spaceId!);
    const { parseRequirements, generateTemplate, isParsing, isGenerating } = useSpaceActions();

    const [requirements, setRequirements] = useState('');
    const [emailTemplate, setEmailTemplate] = useState('');
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [emailStatuses, setEmailStatuses] = useState<Record<string, VendorEmailStatus>>({});

    // Imported emails state
    const [importedEmailsCount, setImportedEmailsCount] = useState(0);
    const [showImportedEmails, setShowImportedEmails] = useState(false);
    const [importedEmails, setImportedEmails] = useState<Email[]>([]);
    const [loadingImported, setLoadingImported] = useState(false);
    const [selectedImportedEmail, setSelectedImportedEmail] = useState<Email | null>(null);
    const [showVendorMapModal, setShowVendorMapModal] = useState(false);
    const [selectedVendorForMap, setSelectedVendorForMap] = useState('');
    const [selectedVendorForConversation, setSelectedVendorForConversation] = useState<{ id: string; name: string; email: string } | null>(null);
    const [showProposalManagement, setShowProposalManagement] = useState(false);

    // Update email template when space data changes
    useEffect(() => {
        if (space?.emailTemplate) {
            setEmailTemplate(space.emailTemplate);
        }
    }, [space?.emailTemplate]);

    // Load imported emails count
    useEffect(() => {
        if (spaceId) {
            loadImportedEmailsCount();
        }
    }, [spaceId]);

    const loadImportedEmailsCount = async () => {
        try {
            const response = await emailService.getImportedEmailsCount(spaceId!);
            setImportedEmailsCount(response.count);
        } catch (error) {
            console.error('Failed to load imported emails count:', error);
        }
    };

    const loadImportedEmails = async () => {
        try {
            setLoadingImported(true);
            const response = await emailService.getImportedEmails(spaceId!);
            setImportedEmails(response.data);
        } catch (error: any) {
            toast.error('Failed to load imported emails');
        } finally {
            setLoadingImported(false);
        }
    };

    const handleShowImportedEmails = () => {
        setShowImportedEmails(true);
        loadImportedEmails();
    };

    const handleMapVendorToEmail = (email: Email) => {
        setSelectedImportedEmail(email);
        setShowVendorMapModal(true);
        setSelectedVendorForMap(email.vendorId?.id || '');
    };

    const handleVendorMapSubmit = async () => {
        if (!selectedImportedEmail || !selectedVendorForMap) {
            toast.error('Please select a vendor');
            return;
        }

        try {
            await emailService.mapToVendor(selectedImportedEmail.id, selectedVendorForMap);
            toast.success('Vendor mapped successfully');
            setShowVendorMapModal(false);
            setSelectedImportedEmail(null);
            setSelectedVendorForMap('');
            loadImportedEmails(); // Refresh
        } catch (error: any) {
            toast.error(error.message || 'Failed to map vendor');
        }
    };

    // Initialize and fetch email statuses for vendors with auto-refresh
    useEffect(() => {
        const fetchStatuses = async () => {
            if (vendors && space?.id) {
                try {
                    // Initialize with defaults first
                    const initialStatuses: Record<string, VendorEmailStatus> = {};
                    vendors.forEach(vendor => {
                        initialStatuses[vendor.id] = {
                            vendorId: vendor.id,
                            sent: false,
                            received: false
                        };
                    });

                    // Fetch actual statuses from backend
                    const response = await fetch(`http://localhost:5000/api/spaces/${space.id}/email-statuses`);
                    if (response.ok) {
                        const data = await response.json();

                        // Check for new received emails
                        const previousStatuses = emailStatuses;
                        let newReceivedCount = 0;

                        // Merge backend data with initial statuses
                        Object.keys(data).forEach(vendorId => {
                            if (initialStatuses[vendorId]) {
                                const wasReceived = previousStatuses[vendorId]?.received || false;
                                const isNowReceived = data[vendorId].received;

                                if (!wasReceived && isNowReceived) {
                                    newReceivedCount++;
                                }

                                initialStatuses[vendorId] = {
                                    ...initialStatuses[vendorId],
                                    sent: data[vendorId].sent,
                                    sentAt: data[vendorId].sentAt ? new Date(data[vendorId].sentAt) : undefined,
                                    received: data[vendorId].received,
                                    receivedAt: data[vendorId].receivedAt ? new Date(data[vendorId].receivedAt) : undefined
                                };
                            }
                        });

                        // Show notification for new emails
                        if (newReceivedCount > 0) {
                            toast.success(`${newReceivedCount} new email${newReceivedCount > 1 ? 's' : ''} received!`, {
                                duration: 5000,
                            });
                        }
                    }
                    setEmailStatuses(initialStatuses);
                } catch (error) {
                    console.error('Failed to fetch email statuses:', error);
                }
            }
        };

        fetchStatuses();

        // Auto-refresh every 30 seconds
        const intervalId = setInterval(() => {
            fetchStatuses();
            loadImportedEmailsCount(); // Also refresh imported emails count
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [vendors, space?.id]);

    // Auto-check for new replies from Gmail
    useEffect(() => {
        const checkForNewReplies = async () => {
            if (space?.id) {
                try {
                    await emailService.checkForReplies();
                    console.log('Checked for new Gmail replies');
                } catch (error) {
                    console.error('Failed to check for replies:', error);
                }
            }
        };

        // Check immediately on mount
        checkForNewReplies();

        // Then check every 60 seconds
        const intervalId = setInterval(checkForNewReplies, 60000); // 60 seconds

        return () => clearInterval(intervalId);
    }, [space?.id]);

    // Auto-open vendor conversation if coming from Compare Proposals page
    useEffect(() => {
        const openVendorChatId = localStorage.getItem('openVendorChat');
        if (openVendorChatId && vendors && vendors.length > 0) {
            // Find the vendor by ID
            const vendor = vendors.find(v => v.id === openVendorChatId);
            if (vendor) {
                // Open the conversation dialog
                setSelectedVendorForConversation({
                    id: vendor.id,
                    name: vendor.name,
                    email: vendor.emails?.[0] || ''
                });
                // Clear the localStorage flag
                localStorage.removeItem('openVendorChat');
            }
        }
    }, [vendors]);


    if (isLoading) return <div className="flex items-center justify-center h-64">Loading space...</div>;
    if (!space) return <div className="flex items-center justify-center h-64">Space not found</div>;

    const handleParse = async () => {
        await parseRequirements({ id: space.id, requirements });
    };

    const handleGenerateTemplate = async () => {
        await generateTemplate(space.id);
    };

    const toggleVendorSelection = (vendorId: string) => {
        setSelectedVendors(prev =>
            prev.includes(vendorId)
                ? prev.filter(id => id !== vendorId)
                : [...prev, vendorId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedVendors.length === vendors?.length) {
            setSelectedVendors([]);
        } else {
            setSelectedVendors(vendors?.map(v => v.id) || []);
        }
    };

    const handleVendorClick = (vendorName: string, companyName: string) => {
        // Replace placeholders in the email template
        let updatedTemplate = emailTemplate;

        // Replace {{vendor_name}} with actual vendor name
        updatedTemplate = updatedTemplate.replace(/\{\{vendor_name\}\}/gi, vendorName);

        // Replace {{company_name}} with actual company name
        updatedTemplate = updatedTemplate.replace(/\{\{company_name\}\}/gi, companyName);

        setEmailTemplate(updatedTemplate);
        toast.success(`Email template updated with ${vendorName}'s information`);
    };

    const handleSendEmails = async () => {
        if (selectedVendors.length === 0) {
            toast.error('Please select at least one vendor');
            return;
        }

        if (!emailTemplate.trim()) {
            toast.error('Email template is empty');
            return;
        }

        setIsSending(true);
        try {

            const result: any = await fetchWrapper('POST', `/spaces/${space.id}/send-rfp`, {
                vendorIds: selectedVendors,
                emailContent: emailTemplate
            });
            console.log({ result })


            // Update email statuses
            const newStatuses = { ...emailStatuses };
            result.results.forEach((r: any) => {
                if (r.status === 'sent') {
                    newStatuses[r.vendorId] = {
                        ...newStatuses[r.vendorId],
                        sent: true,
                        sentAt: new Date(r.sentAt)
                    };
                }
            });
            setEmailStatuses(newStatuses);

            toast.success(`RFP sent to ${selectedVendors.length} vendor(s)`);
            setSelectedVendors([]);
        } catch (error) {
            toast.error('Failed to send emails. Please try again.');
            console.error('Send email error:', error);
        } finally {
            setIsSending(false);
        }
    };

    const getSelectedVendorsForPreview = (): Array<{ name: string; email: string }> => {
        if (!vendors) return [];
        return vendors
            .filter(v => selectedVendors.includes(v.id))
            .map(v => ({
                name: v.name,
                email: v.emails?.[0] || 'No email'
            }));
    };

    const getPersonalizedPreviewContent = (): string => {
        if (!vendors || selectedVendors.length === 0) return emailTemplate;

        // Get the first selected vendor for preview
        const firstVendor = vendors.find(v => selectedVendors.includes(v.id));
        if (!firstVendor) return emailTemplate;

        // Personalize the template with the first vendor's info
        let personalizedContent = emailTemplate;
        personalizedContent = personalizedContent.replace(/\{\{vendor_name\}\}/gi, firstVendor.name);
        personalizedContent = personalizedContent.replace(/\{\{company_name\}\}/gi, firstVendor.companyName || firstVendor.name);

        return personalizedContent;
    };

    const sentCount = Object.values(emailStatuses).filter(s => s.sent).length;
    const receivedCount = Object.values(emailStatuses).filter(s => s.received).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{space.name}</h1>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Status: <span className="font-medium">{space.status}</span></span>
                        <span>Sent: <span className="font-medium">{sentCount}/{vendors?.length || 0}</span></span>
                        <span>Received: <span className="font-medium">{receivedCount}/{vendors?.length || 0}</span></span>
                        {importedEmailsCount > 0 && (
                            <button
                                onClick={handleShowImportedEmails}
                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                <Inbox className="w-4 h-4" />
                                Imported: {importedEmailsCount}
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowProposalManagement(true)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Manage Proposals
                    </Button>
                    <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Email
                    </Button>
                    <Link to={`/spaces/${space.id}/compare`}>
                        <Button variant="outline">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Compare Proposals
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Requirements Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            value={requirements || space.requirements || ''}
                            onChange={(e) => setRequirements(e.target.value)}
                            placeholder="Describe your requirements here..."
                            className="min-h-[200px]"
                        />
                        <Button onClick={handleParse} disabled={isParsing}>
                            {isParsing ? 'Parsing...' : 'Parse Requirements (AI)'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Parsed Data Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Structured Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {space.structuredData ? (
                            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[200px] text-xs">
                                {JSON.stringify(space.structuredData, null, 2)}
                            </pre>
                        ) : (
                            <div className="text-muted-foreground text-sm">No structured data yet. Parse requirements first.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Email Template Section - Editable */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Email Template</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            value={emailTemplate}
                            onChange={(e) => setEmailTemplate(e.target.value)}
                            placeholder="Generate a template first or write your own email..."
                            className="min-h-[300px] font-mono text-sm"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={handleGenerateTemplate}
                                disabled={isGenerating || !space.structuredData}
                                variant="outline"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Email Template (AI)'}
                            </Button>
                            <Button
                                onClick={() => setShowPreview(true)}
                                disabled={selectedVendors.length === 0 || !emailTemplate.trim()}
                                variant="outline"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview Email
                            </Button>
                            <Button
                                onClick={handleSendEmails}
                                disabled={isSending || selectedVendors.length === 0 || !emailTemplate.trim()}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                {isSending ? 'Sending...' : `Send to ${selectedVendors.length} Vendor(s)`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Vendors Table */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Vendors</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleSelectAll}
                                >
                                    {selectedVendors.length === vendors?.length ? 'Deselect All' : 'Select All'}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSendEmails}
                                    disabled={isSending || selectedVendors.length === 0 || !emailTemplate.trim()}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send All ({selectedVendors.length})
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {vendors && vendors.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Categories</TableHead>
                                        <TableHead className="text-center">Sent</TableHead>
                                        <TableHead className="text-center">Received</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vendors.map(vendor => {
                                        const status = emailStatuses[vendor.id];
                                        return (
                                            <TableRow key={vendor.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedVendors.includes(vendor.id)}
                                                        onCheckedChange={() => toggleVendorSelection(vendor.id)}
                                                    />
                                                </TableCell>
                                                <TableCell
                                                    className="font-medium cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                                                    onClick={() => handleVendorClick(vendor.name, vendor.companyName)}
                                                    title="Click to update email template with this vendor's information"
                                                >
                                                    {vendor.name}
                                                </TableCell>
                                                <TableCell>{vendor.companyName}</TableCell>
                                                <TableCell className="text-sm">{vendor.emails?.[0] || 'N/A'}</TableCell>
                                                <TableCell className="text-sm">{vendor.phones?.[0] || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {vendor.categories.slice(0, 2).map((cat, idx) => (
                                                            <span key={idx} className="text-xs bg-secondary px-2 py-0.5 rounded">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                        {vendor.categories.length > 2 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                +{vendor.categories.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {status?.sent ? (
                                                        <div className="flex flex-col items-center">
                                                            <MailCheck className="w-4 h-4 text-green-600" />
                                                            <span className="text-xs text-muted-foreground">
                                                                {status.sentAt && new Date(status.sentAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Mail className="w-4 h-4 text-gray-400 mx-auto" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {status?.received ? (
                                                        <div className="flex flex-col items-center">
                                                            <MailCheck className="w-4 h-4 text-blue-600" />
                                                            <span className="text-xs text-muted-foreground">
                                                                {status.receivedAt && new Date(status.receivedAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Mail className="w-4 h-4 text-gray-400 mx-auto" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedVendorForConversation({
                                                            id: vendor.id,
                                                            name: vendor.name,
                                                            email: vendor.emails?.[0] || ''
                                                        })}
                                                        title="View conversation for this space"
                                                    >
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No vendors found. Add categories to your space to see matching vendors.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Email Preview Dialog */}
            <EmailPreviewDialog
                open={showPreview}
                onOpenChange={setShowPreview}
                subject={`RFP - ${space.name}`}
                content={getPersonalizedPreviewContent()}
                recipients={getSelectedVendorsForPreview()}
                onSend={handleSendEmails}
            />

            {/* Import Email Dialog */}
            <ImportEmailDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                spaceId={space.id}
                vendors={vendors}
                onSuccess={() => {
                    toast.success('Email imported successfully');
                    loadImportedEmailsCount(); // Refresh count
                }}
            />

            {/* Imported Emails Modal */}
            {showImportedEmails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Imported Emails ({importedEmails.length})</h3>
                            <button
                                onClick={() => setShowImportedEmails(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {loadingImported ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-center">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                                    <p className="mt-2 text-sm text-gray-600">Loading emails...</p>
                                </div>
                            </div>
                        ) : importedEmails.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No imported emails yet
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {importedEmails.map((email) => (
                                    <div
                                        key={email.id}
                                        className="border rounded-lg p-4 hover:bg-gray-50"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium">{email.subject || '(No Subject)'}</p>
                                                <p className="text-sm text-gray-600">From: {email.from.email}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {email.bodyPlain?.substring(0, 150)}...
                                                </p>
                                                {email.vendorId && (
                                                    <div className="mt-2">
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                            Mapped to: {email.vendorId.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleMapVendorToEmail(email)}
                                                className="ml-4 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                            >
                                                {email.vendorId ? 'Change Vendor' : 'Map Vendor'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Vendor Mapping Modal */}
            {showVendorMapModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Map Email to Vendor</h3>
                            <button
                                onClick={() => setShowVendorMapModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                From: {selectedImportedEmail?.from.email}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                Subject: {selectedImportedEmail?.subject || '(No Subject)'}
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Vendor
                            </label>
                            <select
                                value={selectedVendorForMap}
                                onChange={(e) => setSelectedVendorForMap(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- Select a Vendor --</option>
                                {vendors?.map((vendor) => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.name} ({vendor.emails?.[0]})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowVendorMapModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVendorMapSubmit}
                                disabled={!selectedVendorForMap}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Map Vendor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vendor Conversation Dialog for this Space */}
            {selectedVendorForConversation && (
                <VendorConversationDialog
                    open={!!selectedVendorForConversation}
                    onOpenChange={(open) => !open && setSelectedVendorForConversation(null)}
                    vendorId={selectedVendorForConversation.id}
                    vendorName={selectedVendorForConversation.name}
                    vendorEmail={selectedVendorForConversation.email}
                    spaceId={space.id}
                />
            )}

            {/* Proposal Management Dialog */}
            {/* <ProposalManagementDialog
                open={showProposalManagement}
                onOpenChange={setShowProposalManagement}
                spaceId={space.id}
                spaceName={space.name}
            /> */}
        </div>
    );
}

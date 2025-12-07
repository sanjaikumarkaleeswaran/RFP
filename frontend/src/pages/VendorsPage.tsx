import { useState } from 'react';
import { Trash2, Eye } from 'lucide-react';
import { useVendors } from '../hooks/useVendors';
import { AddVendorSheet } from '../components/vendors/AddVendorSheet';
import { EditVendorSheet } from '../components/vendors/EditVendorSheet';
import { VendorConversationDialog } from '../components/vendors/VendorConversationDialog';
import { Button } from '../components/ui/button';

export function VendorsPage() {
    const { vendors, isLoading, deleteVendor } = useVendors();
    const [selectedVendor, setSelectedVendor] = useState<{ id: string; name: string; email: string } | null>(null);

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete vendor "${name}"?`)) {
            deleteVendor(id);
        }
    };

    const handleViewConversation = (vendor: any) => {
        setSelectedVendor({
            id: vendor.id,
            name: vendor.name,
            email: vendor.emails?.[0] || ''
        });
    };

    if (isLoading) {
        return <div>Loading vendors...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
                <AddVendorSheet />
            </div>
            <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Company</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Categories</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {vendors?.map((vendor) => (
                                <tr key={vendor.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <td className="p-4 align-middle">{vendor.name}</td>
                                    <td className="p-4 align-middle">{vendor.companyName}</td>
                                    <td className="p-4 align-middle">{vendor.emails.join(', ')}</td>
                                    <td className="p-4 align-middle">{vendor.categories.join(', ')}</td>
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewConversation(vendor)}
                                                title="View email conversation"
                                            >
                                                <Eye className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <EditVendorSheet vendor={vendor} />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(vendor.id, vendor.name)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vendors?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        No vendors found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vendor Conversation Dialog */}
            {selectedVendor && (
                <VendorConversationDialog
                    open={!!selectedVendor}
                    onOpenChange={(open) => !open && setSelectedVendor(null)}
                    vendorId={selectedVendor.id}
                    vendorName={selectedVendor.name}
                    vendorEmail={selectedVendor.email}
                />
            )}
        </div>
    );
}


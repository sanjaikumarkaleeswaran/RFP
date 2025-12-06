import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useVendors } from '../../hooks/useVendors';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from '../ui/sheet';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const formSchema = z.object({
    name: z.string().min(2, { message: 'Name is required.' }),
    companyName: z.string().min(2, { message: 'Company name is required.' }),
    emails: z.string().min(1, { message: 'At least one email is required.' }),
    phones: z.string().optional(),
    categories: z.string().min(1, { message: 'At least one category is required.' }),
    addressLine1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    notes: z.string().optional(),
});

export function AddVendorSheet() {
    const [open, setOpen] = useState(false);
    const { createVendor } = useVendors();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            companyName: '',
            emails: '',
            phones: '',
            categories: '',
            addressLine1: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
            notes: '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const addresses = values.addressLine1
            ? [
                {
                    line1: values.addressLine1,
                    city: values.city,
                    state: values.state,
                    country: values.country,
                    postalCode: values.postalCode,
                },
            ]
            : [];

        createVendor(
            {
                name: values.name,
                companyName: values.companyName,
                emails: values.emails.split(',').map((s) => s.trim()),
                phones: values.phones ? values.phones.split(',').map((s) => s.trim()) : [],
                categories: values.categories.split(',').map((s) => s.trim()),
                addresses,
                notes: values.notes,
            },
            {
                onSuccess: () => {
                    setOpen(false);
                    form.reset();
                },
            }
        );
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Vendor
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Add New Vendor</SheetTitle>
                    <SheetDescription>
                        Add a new vendor to your database.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Acme Inc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="emails"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Emails</FormLabel>
                                        <FormControl>
                                            <Input placeholder="contact@acme.com, sales@acme.com" {...field} />
                                        </FormControl>
                                        <FormDescription>Comma separated</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phones"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Numbers</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1234567890, +0987654321" {...field} />
                                        </FormControl>
                                        <FormDescription>Comma separated (optional)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="categories"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categories</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Electronics, Software" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4 border rounded-md p-4">
                                <h4 className="font-medium text-sm">Address (Optional)</h4>
                                <FormField
                                    control={form.control}
                                    name="addressLine1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Street Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Main St" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="New York" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="NY" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="USA" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="postalCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Postal Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="10001" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Additional notes..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <SheetFooter>
                                <SheetClose asChild>
                                    <Button variant="outline" type="button">
                                        Cancel
                                    </Button>
                                </SheetClose>
                                <Button type="submit">Save Vendor</Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}

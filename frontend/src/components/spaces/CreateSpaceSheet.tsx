import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSpaces } from '../../hooks/useSpaces';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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

const formSchema = z.object({
    name: z.string().min(2, {
        message: 'Name must be at least 2 characters.',
    }),
    categories: z.string().min(1, {
        message: 'At least one category is required.',
    }),
});

export function CreateSpaceSheet() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { createSpace } = useSpaces();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            categories: '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        createSpace(
            {
                name: values.name,
                categories: values.categories.split(',').map((c) => c.trim()),
            },
            {
                onSuccess: (data) => {
                    setOpen(false);
                    form.reset();
                    // Navigate to the newly created space
                    navigate(`/spaces/${data.id}`);
                },
            }
        );
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Space
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[540px]">
                <SheetHeader>
                    <SheetTitle>Create New Space</SheetTitle>
                    <SheetDescription>
                        Create a dedicated space to manage your product requests (e.g., Laptop Procurement, Office Supplies).
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Space Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Laptop Procurement" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Give your space a descriptive name for the product or service you're requesting.
                                        </FormDescription>
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
                                            <Input
                                                placeholder="e.g. Electronics, Hardware, IT Equipment"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Separate multiple categories with commas. This helps match vendors to your request.
                                        </FormDescription>
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
                                <Button type="submit">Create Space</Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSpaces } from '../../hooks/useSpaces';
import type { Space } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
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
import { Pencil } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(2, {
        message: 'Name must be at least 2 characters.',
    }),
    description: z.string().optional(),
    categories: z.string().min(1, {
        message: 'At least one category is required.',
    }),
});

interface EditSpaceSheetProps {
    space: Space;
}

export function EditSpaceSheet({ space }: EditSpaceSheetProps) {
    const [open, setOpen] = useState(false);
    const { updateSpace } = useSpaces();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: space.name,
            description: space.description || '',
            categories: space.categories.join(', '),
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        updateSpace(
            {
                id: space.id,
                data: {
                    name: values.name,
                    description: values.description,
                    categories: values.categories.split(',').map((c) => c.trim()),
                },
            },
            {
                onSuccess: () => {
                    setOpen(false);
                },
            }
        );
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
                <Pencil className="h-4 w-4" />
            </Button>
            <SheetContent className="sm:max-w-[540px]">
                <SheetHeader>
                    <SheetTitle>Edit Space</SheetTitle>
                    <SheetDescription>
                        Update the details of this space.
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
                                            <Input placeholder="e.g. Q4 Laptop Procurement" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the purpose of this space..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
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
                                                placeholder="e.g. Electronics, Hardware (comma separated)"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Separate multiple categories with commas.
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
                                <Button type="submit">Save Changes</Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}

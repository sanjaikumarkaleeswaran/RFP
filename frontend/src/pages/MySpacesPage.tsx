import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useSpaces } from '../hooks/useSpaces';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { CreateSpaceSheet } from '../components/spaces/CreateSpaceSheet';
import { EditSpaceSheet } from '../components/spaces/EditSpaceSheet';
import { Button } from '../components/ui/button';

export function MySpacesPage() {
    const { spaces, isLoading, deleteSpace } = useSpaces();

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            deleteSpace(id);
        }
    };

    if (isLoading) {
        return <div>Loading spaces...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">My Spaces</h1>
                <CreateSpaceSheet />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {spaces?.map((space) => (
                    <Card key={space.id} className="hover:shadow-md transition-shadow h-full flex flex-col">
                        <Link to={`/spaces/${space.id}`} className="flex-1">
                            <CardHeader>
                                <CardTitle>{space.name}</CardTitle>
                                <CardDescription>{space.description || 'No description'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {space.categories.map((cat) => (
                                        <span key={cat} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Link>
                        <CardFooter className="flex justify-end gap-2 pt-0">
                            <EditSpaceSheet space={space} />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete(space.id, space.name);
                                }}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {spaces?.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No spaces found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}


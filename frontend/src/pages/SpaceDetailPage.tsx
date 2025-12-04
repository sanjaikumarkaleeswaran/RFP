import { useParams } from 'react-router-dom';

export function SpaceDetailPage() {
    const { spaceId } = useParams();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Space Details: {spaceId}</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Requirements</h3>
                        <textarea
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Describe your requirements here..."
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Parsed Data (AI)</h3>
                        <div className="rounded-md bg-muted p-4 text-sm font-mono">
                            Waiting for requirements...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

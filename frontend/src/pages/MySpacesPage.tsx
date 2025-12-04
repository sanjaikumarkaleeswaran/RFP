import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export function MySpacesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">My Spaces</h1>
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
                    <Plus className="h-4 w-4" />
                    Create Space
                </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder Space Card */}
                <Link to="/spaces/1" className="block">
                    <div className="rounded-xl border bg-card text-card-foreground shadow hover:shadow-md transition-shadow">
                        <div className="p-6 space-y-2">
                            <h3 className="text-lg font-semibold">Laptops Procurement</h3>
                            <p className="text-sm text-muted-foreground">Requirements for 50 new developer laptops.</p>
                            <div className="flex gap-2 pt-2">
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    Electronics
                                </span>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    Hardware
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

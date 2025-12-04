export function InboxPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Connect Gmail
                </button>
            </div>
            <div className="rounded-md border">
                <div className="p-4 text-center text-sm text-muted-foreground">
                    No emails found. Connect your Gmail account to get started.
                </div>
            </div>
        </div>
    );
}

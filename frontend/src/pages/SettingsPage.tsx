export function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Integrations</h3>
                <div className="flex items-center justify-between py-4 border-b last:border-0">
                    <div>
                        <p className="font-medium">Gmail</p>
                        <p className="text-sm text-muted-foreground">Connect your Gmail account to import emails.</p>
                    </div>
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                        Connect
                    </button>
                </div>
            </div>
        </div>
    );
}

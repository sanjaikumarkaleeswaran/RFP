import { useState, useEffect } from 'react';
import { emailService } from '../services/email.service';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export function SettingsPage() {
    const [gmailStatus, setGmailStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadGmailStatus();
    }, []);

    const loadGmailStatus = async () => {
        try {
            const status = await emailService.getGmailStatus();
            setGmailStatus(status);
        } catch (error) {
            console.error('Failed to load Gmail status:', error);
        }
    };

    const handleConnectGmail = async () => {
        try {
            setLoading(true);
            const response = await emailService.getGmailAuthUrl();
            if (response.authUrl) {
                // Open Gmail OAuth in new window
                window.location.href = response.authUrl;
            }
        } catch (error: any) {
            toast.error('Failed to get Gmail auth URL');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnectGmail = async () => {
        try {
            setLoading(true);
            await emailService.disconnectGmail();
            toast.success('Gmail disconnected successfully');
            loadGmailStatus();
        } catch (error: any) {
            toast.error('Failed to disconnect Gmail');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Integrations</h3>
                <div className="flex items-center justify-between py-4 border-b last:border-0">
                    <div>
                        <p className="font-medium">Gmail</p>
                        <p className="text-sm text-muted-foreground">
                            {gmailStatus?.connected
                                ? `Connected as ${gmailStatus.email}`
                                : 'Connect your Gmail account to send and receive emails.'}
                        </p>
                    </div>
                    {gmailStatus?.connected ? (
                        <Button
                            variant="outline"
                            onClick={handleDisconnectGmail}
                            disabled={loading}
                        >
                            {loading ? 'Disconnecting...' : 'Disconnect'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleConnectGmail}
                            disabled={loading}
                        >
                            {loading ? 'Connecting...' : 'Connect Gmail'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

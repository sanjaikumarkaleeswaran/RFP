import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  Mail,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Inbox,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { fetchWrapper } from '../shared/utils/fetchWrapper';

interface DashboardStats {
  totalSpaces: number;
  activeSpaces: number;
  totalVendors: number;
  totalProposals: number;
  pendingProposals: number;
  acceptedProposals: number;
  recentSpaces: any[];
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSpaces: 0,
    activeSpaces: 0,
    totalVendors: 0,
    totalProposals: 0,
    pendingProposals: 0,
    acceptedProposals: 0,
    recentSpaces: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load spaces and vendors
      const [spacesRes, vendorsRes] = await Promise.all([
        fetchWrapper('GET', '/spaces'),
        fetchWrapper('GET', '/vendors')
      ]);

      console.log('Spaces response:', spacesRes);
      console.log('Vendors response:', vendorsRes);

      // The API returns arrays directly, not wrapped in { data: [] }
      const spaces = Array.isArray(spacesRes) ? spacesRes : [];
      const vendors = Array.isArray(vendorsRes) ? vendorsRes : [];

      console.log('Parsed spaces:', spaces);
      console.log('Parsed vendors:', vendors);

      // Fetch all proposals for all spaces
      let allProposals: any[] = [];
      try {
        const proposalPromises = spaces.map((space: any) =>
          fetchWrapper('GET', `/vendor-proposals/space/${space.id}`).catch(() => ({ data: [] }))
        );
        const proposalResults = await Promise.all(proposalPromises);
        allProposals = proposalResults.flatMap((res: any) =>
          Array.isArray(res) ? res : (res.data || [])
        );
      } catch (error) {
        console.error('Failed to load proposals:', error);
      }

      console.log('All proposals:', allProposals);

      // Count proposals by status
      const pendingProposals = allProposals.filter((p: any) => p.status === 'pending').length;
      const acceptedProposals = allProposals.filter((p: any) => p.status === 'accepted').length;

      // Calculate stats
      const activeSpaces = spaces.filter((s: any) => s.status === 'active').length;
      const recentSpaces = spaces.slice(0, 5);

      setStats({
        totalSpaces: spaces.length,
        activeSpaces,
        totalVendors: vendors.length,
        totalProposals: allProposals.length,
        pendingProposals,
        acceptedProposals,
        recentSpaces
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your RFP Management System
          </p>
        </div>
        <Link to="/myspaces">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New RFP
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total RFPs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RFPs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpaces}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSpaces} active
            </p>
          </CardContent>
        </Card>

        {/* Total Vendors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendors}</div>
            <p className="text-xs text-muted-foreground">
              In your network
            </p>
          </CardContent>
        </Card>

        {/* Pending Proposals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingProposals}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your decision
            </p>
          </CardContent>
        </Card>

        {/* Accepted Proposals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptedProposals}</div>
            <p className="text-xs text-muted-foreground">
              Proposals approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/myspaces">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Create New RFP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Start a new Request for Proposal and invite vendors
              </p>
              <Button variant="outline" className="w-full gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/vendors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Manage Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add, edit, or view your vendor network
              </p>
              <Button variant="outline" className="w-full gap-2">
                View Vendors
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/inbox">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-blue-600" />
                Check Inbox
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View and import vendor responses from Gmail
              </p>
              <Button variant="outline" className="w-full gap-2">
                Open Inbox
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent RFPs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent RFPs</CardTitle>
            <Link to="/myspaces">
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentSpaces.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No RFPs yet</p>
              <Link to="/myspaces">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First RFP
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentSpaces.map((space: any) => (
                <Link
                  key={space.id}
                  to={`/spaces/${space.id}`}
                  className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{space.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {space.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {space.vendors?.length || 0} vendors
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(space.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${space.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {space.status || 'draft'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              AI-Powered Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our AI automatically analyzes vendor proposals, extracts key information,
              and provides intelligent recommendations to help you make the best decision.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Smart Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Compare proposals side-by-side with detailed scoring on price, quality,
              delivery time, and completeness. Get instant insights on strengths and weaknesses.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

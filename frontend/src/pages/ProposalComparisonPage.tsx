import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ArrowLeft, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface VendorScore {
    vendorId: string;
    vendorName: string;
    scores: {
        priceCompetitiveness: number;
        termsQuality: number;
        deliverySpeed: number;
        completeness: number;
        overallValue: number;
    };
    strengths: string[];
    weaknesses: string[];
}

interface ComparisonData {
    spaceId: string;
    spaceName: string;
    totalProposals: number;
    proposals: any[];
    comparison: {
        summary: string;
        vendorScores: VendorScore[];
        priceComparison: {
            lowestPrice: { vendorName: string; amount: number; currency: string };
            highestPrice: { vendorName: string; amount: number; currency: string };
            averagePrice: number;
        };
        recommendation: {
            recommendedVendor: string;
            reasoning: string;
            alternativeOptions: string[];
            riskFactors: string[];
        };
    };
}

export function ProposalComparisonPage() {
    const { spaceId } = useParams();
    const [data, setData] = useState<ComparisonData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadComparison();
    }, [spaceId]);

    const loadComparison = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/spaces/${spaceId}/proposals/compare`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load comparison');
            }

            const result = await response.json();
            setData(result);
        } catch (error) {
            toast.error('Failed to load proposal comparison');
            console.error('Load comparison error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Analyzing proposals with AI...</p>
                </div>
            </div>
        );
    }

    if (!data || !data.comparison) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link to={`/spaces/${spaceId}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Space
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Proposal Comparison</h1>
                </div>
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No proposals available for comparison yet.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Proposals will appear here once vendors respond to your RFP.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { comparison } = data;
    const recommendedVendor = comparison.vendorScores.find(
        v => v.vendorName === comparison.recommendation.recommendedVendor
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to={`/spaces/${spaceId}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{data.spaceName} - Proposal Comparison</h1>
                        <p className="text-muted-foreground">{data.totalProposals} proposals received</p>
                    </div>
                </div>
                <Button onClick={loadComparison} variant="outline">
                    Refresh Analysis
                </Button>
            </div>

            {/* AI Recommendation Card */}
            <Card className="border-2 border-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        AI Recommendation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">
                            Recommended Vendor: {comparison.recommendation.recommendedVendor}
                        </h3>
                        <p className="text-muted-foreground">{comparison.recommendation.reasoning}</p>
                    </div>

                    {recommendedVendor && (
                        <div className="grid grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {recommendedVendor.scores.overallValue}
                                </div>
                                <div className="text-xs text-muted-foreground">Overall Score</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold">{recommendedVendor.scores.priceCompetitiveness}</div>
                                <div className="text-xs text-muted-foreground">Price</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold">{recommendedVendor.scores.termsQuality}</div>
                                <div className="text-xs text-muted-foreground">Terms</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold">{recommendedVendor.scores.deliverySpeed}</div>
                                <div className="text-xs text-muted-foreground">Delivery</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold">{recommendedVendor.scores.completeness}</div>
                                <div className="text-xs text-muted-foreground">Completeness</div>
                            </div>
                        </div>
                    )}

                    {comparison.recommendation.alternativeOptions.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2">Alternative Options:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {comparison.recommendation.alternativeOptions.map((option, idx) => (
                                    <li key={idx}>{option}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {comparison.recommendation.riskFactors.length > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">Risk Factors:</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                                    {comparison.recommendation.riskFactors.map((risk, idx) => (
                                        <li key={idx}>{risk}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{comparison.summary}</p>
                </CardContent>
            </Card>

            {/* Price Comparison */}
            {comparison.priceComparison && comparison.priceComparison.lowestPrice && (
                <Card>
                    <CardHeader>
                        <CardTitle>Price Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-900 dark:text-green-100">Lowest Price</span>
                                </div>
                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {comparison.priceComparison.lowestPrice.currency || '$'} {comparison.priceComparison.lowestPrice.amount?.toLocaleString() || 'N/A'}
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400">
                                    {comparison.priceComparison.lowestPrice.vendorName}
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Average Price</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {comparison.priceComparison.lowestPrice.currency || '$'} {comparison.priceComparison.averagePrice?.toLocaleString() || 'N/A'}
                                </div>
                            </div>

                            {comparison.priceComparison.highestPrice && (
                                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-red-600" />
                                        <span className="text-sm font-medium text-red-900 dark:text-red-100">Highest Price</span>
                                    </div>
                                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                        {comparison.priceComparison.highestPrice.currency || '$'} {comparison.priceComparison.highestPrice.amount?.toLocaleString() || 'N/A'}
                                    </div>
                                    <div className="text-sm text-red-600 dark:text-red-400">
                                        {comparison.priceComparison.highestPrice.vendorName}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Vendor Scores Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Vendor Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead className="text-center">Overall</TableHead>
                                <TableHead className="text-center">Price</TableHead>
                                <TableHead className="text-center">Terms</TableHead>
                                <TableHead className="text-center">Delivery</TableHead>
                                <TableHead className="text-center">Completeness</TableHead>
                                <TableHead>Strengths</TableHead>
                                <TableHead>Weaknesses</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {comparison.vendorScores.map((vendor) => (
                                <TableRow key={vendor.vendorId} className={vendor.vendorName === comparison.recommendation.recommendedVendor ? 'bg-primary/5' : ''}>
                                    <TableCell className="font-medium">
                                        {vendor.vendorName}
                                        {vendor.vendorName === comparison.recommendation.recommendedVendor && (
                                            <Award className="w-4 h-4 inline-block ml-2 text-primary" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="text-lg font-bold text-primary">{vendor.scores.overallValue}</div>
                                    </TableCell>
                                    <TableCell className="text-center">{vendor.scores.priceCompetitiveness}</TableCell>
                                    <TableCell className="text-center">{vendor.scores.termsQuality}</TableCell>
                                    <TableCell className="text-center">{vendor.scores.deliverySpeed}</TableCell>
                                    <TableCell className="text-center">{vendor.scores.completeness}</TableCell>
                                    <TableCell>
                                        <ul className="text-xs space-y-1">
                                            {vendor.strengths.slice(0, 2).map((s, idx) => (
                                                <li key={idx} className="text-green-600">✓ {s}</li>
                                            ))}
                                        </ul>
                                    </TableCell>
                                    <TableCell>
                                        <ul className="text-xs space-y-1">
                                            {vendor.weaknesses.slice(0, 2).map((w, idx) => (
                                                <li key={idx} className="text-red-600">✗ {w}</li>
                                            ))}
                                        </ul>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

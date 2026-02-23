/**
 * AI Analysis Display Component
 * Beautiful visualization of AI-powered proposal analysis
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

// Inline progress bar — the shadcn Progress component is not installed
const Progress = ({ value, className }: { value: number; className?: string }) => (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className ?? ''}`}>
        <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
    </div>
);

import {
    TrendingUp,
    TrendingDown,
    Award,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Brain,
    FileText,
    DollarSign,
    Calendar,
    Shield,
    Zap
} from 'lucide-react';

interface AIAnalysisDisplayProps {
    proposal: any;
    showDetails?: boolean;
}

export const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({
    proposal,
    showDetails = true
}) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Fair';
        return 'Needs Improvement';
    };

    return (
        <div className="space-y-6">
            {/* Overall Score Card */}
            <Card className="border-2 border-primary/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${getScoreBgColor(proposal.overallScore)}`}>
                                <Brain className={`h-6 w-6 ${getScoreColor(proposal.overallScore)}`} />
                            </div>
                            <div>
                                <CardTitle>AI Analysis Score</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Powered by Mistral AI
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-4xl font-bold ${getScoreColor(proposal.overallScore)}`}>
                                {proposal.overallScore}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {getScoreLabel(proposal.overallScore)}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress
                        value={proposal.overallScore}
                        className="h-3"
                    />
                </CardContent>
            </Card>

            {/* AI Summary */}
            {proposal.aiSummary && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            AI Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            {proposal.aiSummary}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Personalized Feedback */}
            {proposal.personalFeedback && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <Zap className="h-5 w-5" />
                            Personalized Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-blue-900/80 leading-relaxed">
                            {proposal.personalFeedback}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Strengths and Weaknesses */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                {proposal.strengths && proposal.strengths.length > 0 && (
                    <Card className="border-green-200 bg-green-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-900">
                                <TrendingUp className="h-5 w-5" />
                                Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {proposal.strengths.map((strength: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-green-900/80">{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Weaknesses */}
                {proposal.weaknesses && proposal.weaknesses.length > 0 && (
                    <Card className="border-red-200 bg-red-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-900">
                                <TrendingDown className="h-5 w-5" />
                                Areas for Improvement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {proposal.weaknesses.map((weakness: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-red-900/80">{weakness}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Criteria Analysis */}
            {showDetails && proposal.criteriaAnalysis && proposal.criteriaAnalysis.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Detailed Criteria Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {proposal.criteriaAnalysis.map((criteria: any, idx: number) => (
                                <div key={idx} className="border-b last:border-0 pb-4 last:pb-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">{criteria.criteriaName}</h4>
                                        <Badge variant={criteria.score >= 7 ? 'default' : 'secondary'}>
                                            {criteria.score}/10
                                        </Badge>
                                    </div>
                                    <Progress value={criteria.score * 10} className="h-2 mb-2" />
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {criteria.feedback}
                                    </p>
                                    {criteria.evidence && (
                                        <div className="bg-muted/50 p-3 rounded-md">
                                            <p className="text-xs italic text-muted-foreground">
                                                "{criteria.evidence}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Extracted Data */}
            {showDetails && proposal.extractedData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Extracted Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Pricing */}
                            {proposal.extractedData.pricing && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <DollarSign className="h-4 w-4" />
                                        Pricing
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-md">
                                        {proposal.extractedData.pricing.total && (
                                            <div className="text-2xl font-bold">
                                                ${proposal.extractedData.pricing.total.toLocaleString()}
                                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                                    {proposal.extractedData.pricing.currency || 'USD'}
                                                </span>
                                            </div>
                                        )}
                                        {proposal.extractedData.pricing.breakdown && (
                                            <div className="mt-2 space-y-1">
                                                {proposal.extractedData.pricing.breakdown.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">{item.item}</span>
                                                        <span className="font-medium">${item.amount.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            {proposal.extractedData.timeline && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <Calendar className="h-4 w-4" />
                                        Timeline
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-md space-y-2">
                                        {proposal.extractedData.timeline.deliveryDate && (
                                            <div>
                                                <div className="text-xs text-muted-foreground">Delivery Date</div>
                                                <div className="font-semibold">
                                                    {proposal.extractedData.timeline.deliveryDate}
                                                </div>
                                            </div>
                                        )}
                                        {proposal.extractedData.timeline.leadTime && (
                                            <div>
                                                <div className="text-xs text-muted-foreground">Lead Time</div>
                                                <div className="font-semibold">
                                                    {proposal.extractedData.timeline.leadTime}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Compliance */}
                            {proposal.extractedData.compliance && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <Shield className="h-4 w-4" />
                                        Compliance & Certifications
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-md">
                                        {proposal.extractedData.compliance.certifications && (
                                            <div className="flex flex-wrap gap-2">
                                                {proposal.extractedData.compliance.certifications.map((cert: string, idx: number) => (
                                                    <Badge key={idx} variant="outline">
                                                        {cert}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Terms */}
                            {proposal.extractedData.terms && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <FileText className="h-4 w-4" />
                                        Terms & Conditions
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-md space-y-2 text-sm">
                                        {proposal.extractedData.terms.paymentTerms && (
                                            <div>
                                                <span className="text-muted-foreground">Payment: </span>
                                                <span>{proposal.extractedData.terms.paymentTerms}</span>
                                            </div>
                                        )}
                                        {proposal.extractedData.terms.warranty && (
                                            <div>
                                                <span className="text-muted-foreground">Warranty: </span>
                                                <span>{proposal.extractedData.terms.warranty}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AI Recommendation */}
            {proposal.aiRecommendation && (
                <Card className={`border-2 ${proposal.aiRecommendation.isRecommended
                    ? 'border-green-500 bg-green-50/50'
                    : 'border-gray-300'
                    }`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {proposal.aiRecommendation.isRecommended ? (
                                <>
                                    <Award className="h-5 w-5 text-green-600" />
                                    <span className="text-green-900">Recommended Vendor</span>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <span>AI Recommendation</span>
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <div className="text-sm font-semibold mb-1">Rank</div>
                            <Badge variant="outline" className="text-lg">
                                #{proposal.aiRecommendation.rank}
                            </Badge>
                        </div>
                        <div>
                            <div className="text-sm font-semibold mb-1">Reasoning</div>
                            <p className="text-muted-foreground">
                                {proposal.aiRecommendation.reasoning}
                            </p>
                        </div>
                        {proposal.aiRecommendation.comparisonNotes && (
                            <div>
                                <div className="text-sm font-semibold mb-1">Comparison Notes</div>
                                <p className="text-muted-foreground">
                                    {proposal.aiRecommendation.comparisonNotes}
                                </p>
                            </div>
                        )}
                        {proposal.aiRecommendation.riskFactors &&
                            proposal.aiRecommendation.riskFactors.length > 0 && (
                                <div>
                                    <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        Risk Factors
                                    </div>
                                    <ul className="space-y-1">
                                        {proposal.aiRecommendation.riskFactors.map((risk: string, idx: number) => (
                                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <span className="text-yellow-600">•</span>
                                                {risk}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                    </CardContent>
                </Card>
            )}

            {/* Attachment Analyses */}
            {showDetails && proposal.attachmentAnalyses && proposal.attachmentAnalyses.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Attachment Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {proposal.attachmentAnalyses.map((attachment: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold">{attachment.filename}</div>
                                        <Badge variant="outline">
                                            {attachment.analysisType}
                                        </Badge>
                                    </div>
                                    {attachment.insights && (
                                        <p className="text-sm text-muted-foreground">
                                            {attachment.insights}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AIAnalysisDisplay;

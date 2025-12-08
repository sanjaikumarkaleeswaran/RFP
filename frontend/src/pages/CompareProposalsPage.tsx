import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Award,
    CheckCircle,
    XCircle,
    DollarSign,
    Calendar,
    FileText,
    Sparkles,
    AlertCircle,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { vendorProposalService, type VendorProposal } from '../services/vendor-proposal.service';
import { spaceService } from '../services/space.service';
import type { Space } from '../types';

export default function CompareProposalsPage() {
    const { spaceId } = useParams<{ spaceId: string }>();
    const navigate = useNavigate();

    const [space, setSpace] = useState<Space | null>(null);
    const [proposals, setProposals] = useState<VendorProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [comparing, setComparing] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<VendorProposal | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [spaceId]);

    const loadData = async () => {
        if (!spaceId) return;

        try {
            setLoading(true);
            const [spaceData, proposalsData] = await Promise.all([
                spaceService.getById(spaceId),
                vendorProposalService.getProposalsBySpace(spaceId)
            ]);

            setSpace(spaceData);
            setProposals(proposalsData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load proposals');
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = async () => {
        if (!spaceId) return;

        try {
            setComparing(true);
            toast.loading('AI is analyzing and comparing proposals...');

            const comparedProposals = await vendorProposalService.compareProposals(spaceId);

            setProposals(comparedProposals);
            setShowRecommendations(true);
            toast.dismiss();
            toast.success('AI comparison complete!');
        } catch (error) {
            console.error('Error comparing proposals:', error);
            toast.dismiss();
            toast.error('Failed to compare proposals');
        } finally {
            setComparing(false);
        }
    };

    const handleAccept = async (proposal: VendorProposal) => {
        if (!confirm(`Accept proposal from ${(proposal as any).vendorId?.name || 'this vendor'}?`)) {
            return;
        }

        try {
            toast.loading('Accepting proposal...');
            await vendorProposalService.acceptProposal(proposal.id);
            toast.dismiss();
            toast.success('Proposal accepted! Notification email sent to vendor.');
            loadData();
        } catch (error) {
            console.error('Error accepting proposal:', error);
            toast.dismiss();
            toast.error('Failed to accept proposal');
        }
    };

    const handleReject = async () => {
        if (!selectedProposal || !rejectReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            toast.loading('Rejecting proposal...');
            await vendorProposalService.rejectProposal(selectedProposal.id, rejectReason);
            toast.dismiss();
            toast.success('Proposal rejected. Notification email sent to vendor.');
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedProposal(null);
            loadData();
        } catch (error) {
            console.error('Error rejecting proposal:', error);
            toast.dismiss();
            toast.error('Failed to reject proposal');
        }
    };

    const openRejectModal = (proposal: VendorProposal) => {
        setSelectedProposal(proposal);
        setShowRejectModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading proposals...</p>
                </div>
            </div>
        );
    }

    if (!space || proposals.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Proposals Yet</h2>
                        <p className="text-gray-600">
                            Vendor proposals will appear here once they reply to your RFP.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Compare Proposals
                            </h1>
                            <p className="text-gray-600">
                                {space.name} • {proposals.length} {proposals.length === 1 ? 'Proposal' : 'Proposals'}
                            </p>
                        </div>
                        <button
                            onClick={handleCompare}
                            disabled={comparing || proposals.length < 2}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                        >
                            <Sparkles className="w-5 h-5" />
                            {comparing ? 'Analyzing...' : 'Get AI Recommendations'}
                        </button>
                    </div>
                </div>

                {/* AI Recommendations Banner */}
                {showRecommendations && proposals.some(p => p.aiRecommendation) && (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
                        <div className="flex items-start gap-4">
                            <Sparkles className="w-8 h-8 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-2">AI Recommendations</h2>
                                <p className="text-indigo-100 mb-4">
                                    Based on comprehensive analysis of all proposals, here are our recommendations:
                                </p>
                                <div className="space-y-2">
                                    {proposals
                                        .filter(p => p.aiRecommendation?.isRecommended)
                                        .map(p => (
                                            <div key={p.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Award className="w-5 h-5 text-yellow-300" />
                                                    <span className="font-semibold">
                                                        Rank #{p.aiRecommendation?.rank}: {(p as any).vendorId?.name}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-indigo-100">
                                                    {p.aiRecommendation?.reasoning}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Proposals Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {proposals.map((proposal) => (
                        <div
                            key={proposal.id}
                            className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${proposal.aiRecommendation?.isRecommended
                                ? 'ring-2 ring-indigo-500'
                                : ''
                                }`}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">
                                            {(proposal as any).vendorId?.name || 'Unknown Vendor'}
                                        </h3>
                                        <p className="text-indigo-100 text-sm">
                                            {(proposal as any).vendorId?.email}
                                        </p>
                                    </div>
                                    {proposal.aiRecommendation?.isRecommended && (
                                        <Award className="w-6 h-6 text-yellow-300" />
                                    )}
                                </div>

                                {/* Overall Score */}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="text-sm text-indigo-100 mb-1">Overall Score</div>
                                        <div className="text-4xl font-bold">{proposal.overallScore}</div>
                                    </div>
                                    {proposal.aiRecommendation && (
                                        <div className="text-right">
                                            <div className="text-sm text-indigo-100 mb-1">AI Rank</div>
                                            <div className="text-3xl font-bold">#{proposal.aiRecommendation.rank}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* AI Summary */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-600" />
                                        AI Summary
                                    </h4>
                                    <p className="text-sm text-gray-600">{proposal.aiSummary}</p>
                                </div>

                                {/* Strengths */}
                                {proposal.strengths.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            Strengths
                                        </h4>
                                        <ul className="space-y-1">
                                            {proposal.strengths.map((strength, idx) => (
                                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                    <span>{strength}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Weaknesses */}
                                {proposal.weaknesses.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <TrendingDown className="w-4 h-4 text-red-600" />
                                            Weaknesses
                                        </h4>
                                        <ul className="space-y-1">
                                            {proposal.weaknesses.map((weakness, idx) => (
                                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                                    <span>{weakness}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Key Details */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    {proposal.extractedData.pricing?.total && (
                                        <div>
                                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="text-xs font-medium">Price</span>
                                            </div>
                                            <div className="text-lg font-bold text-gray-900">
                                                {proposal.extractedData.pricing.currency || '$'}
                                                {proposal.extractedData.pricing.total.toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                    {proposal.extractedData.timeline?.deliveryDate && (
                                        <div>
                                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-xs font-medium">Delivery</span>
                                            </div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {proposal.extractedData.timeline.deliveryDate}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* AI Recommendation */}
                                {proposal.aiRecommendation && (
                                    <div className="bg-indigo-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-indigo-900 mb-2">AI Reasoning</h4>
                                        <p className="text-sm text-indigo-700">
                                            {proposal.aiRecommendation.reasoning}
                                        </p>
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className="flex items-center gap-2">
                                    {proposal.status === 'accepted' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                            <CheckCircle className="w-4 h-4" />
                                            Accepted
                                        </span>
                                    )}
                                    {proposal.status === 'rejected' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                            <XCircle className="w-4 h-4" />
                                            Rejected
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                {proposal.status === 'analyzed' && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <button
                                            onClick={() => handleAccept(proposal)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => openRejectModal(proposal)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            <ThumbsDown className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && selectedProposal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Reject Proposal
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Please provide a reason for rejecting this proposal. This will be sent to the vendor.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            rows={4}
                        />
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                    setSelectedProposal(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim()}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Reject & Send Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

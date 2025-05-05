"use client";

import { useEffect, useState } from "react";
import {
	AlertTriangle,
	Info,
	TrendingUp,
	TrendingDown,
	Percent,
} from "lucide-react";
import type { FinancialReality } from "@/lib/sonarFinancial";

interface NarrativeFinancialComparisonProps {
	company: string;
	narratives: string[];
	financialData?: FinancialReality;
	isLoading?: boolean;
}

interface ComparisonResult {
	score: number; // 0-100 scale
	divergence: "low" | "medium" | "high";
	summary: string;
	keyPoints: string[];
}

export default function NarrativeFinancialComparison({
	company,
	narratives,
	financialData,
	isLoading = false,
}: NarrativeFinancialComparisonProps) {
	const [comparison, setComparison] = useState<ComparisonResult | null>(null);

	// Calculate divergence score and comparison points
	useEffect(() => {
		if (!financialData || narratives.length === 0) return;

		// Simple algorithm to calculate divergence based on keyword matching
		const calculateDivergence = () => {
			// Combine all narrative points and financial data
			const allNarratives = narratives.join(" ").toLowerCase();
			const allFinancials = [
				...financialData.fundamentals,
				...financialData.risks,
				...financialData.trends,
			]
				.join(" ")
				.toLowerCase();

			// Define sentiment keywords
			const positiveTerms = [
				"growth",
				"profit",
				"increase",
				"success",
				"positive",
				"strong",
				"innovation",
				"beat",
				"exceed",
				"outperform",
				"surge",
				"rising",
				"momentum",
				"bullish",
			];

			const negativeTerms = [
				"decline",
				"loss",
				"decrease",
				"failure",
				"negative",
				"weak",
				"problem",
				"miss",
				"below",
				"underperform",
				"drop",
				"falling",
				"slowdown",
				"bearish",
			];

			// Count positive and negative terms in both datasets
			const narrativePositiveCount = positiveTerms.filter((term) =>
				allNarratives.includes(term)
			).length;
			const narrativeNegativeCount = negativeTerms.filter((term) =>
				allNarratives.includes(term)
			).length;

			const financialPositiveCount = positiveTerms.filter((term) =>
				allFinancials.includes(term)
			).length;
			const financialNegativeCount = negativeTerms.filter((term) =>
				allFinancials.includes(term)
			).length;

			// Calculate sentiment scores (-1 to 1 scale)
			const narrativeSentiment =
				narrativePositiveCount + narrativeNegativeCount > 0
					? (narrativePositiveCount - narrativeNegativeCount) /
					  (narrativePositiveCount + narrativeNegativeCount)
					: 0;

			const financialSentiment =
				financialPositiveCount + financialNegativeCount > 0
					? (financialPositiveCount - financialNegativeCount) /
					  (financialPositiveCount + financialNegativeCount)
					: 0;

			// Calculate divergence
			const sentimentDivergence = Math.abs(
				narrativeSentiment - financialSentiment
			);

			// Generate key points based on comparison
			const keyPoints: string[] = [];

			// Compare sentiment
			if (narrativeSentiment > 0 && financialSentiment < 0) {
				keyPoints.push(
					"Media portrays the company positively while financials show concerning indicators."
				);
			} else if (narrativeSentiment < 0 && financialSentiment > 0) {
				keyPoints.push(
					"Media portrays the company negatively despite positive financial indicators."
				);
			}

			// Compare specific points (simplified for demonstration)
			if (
				allNarratives.includes("growth") &&
				allFinancials.includes("decline")
			) {
				keyPoints.push(
					"Media mentions growth while financial data indicates decline in key areas."
				);
			}

			if (
				allNarratives.includes("profit") &&
				allFinancials.includes("loss")
			) {
				keyPoints.push(
					"Media highlights profitability while financial statements show losses."
				);
			}

			// Add generic points if specific ones weren't found
			if (keyPoints.length === 0) {
				if (sentimentDivergence > 0.5) {
					keyPoints.push(
						"Media narrative and financial reality show significant differences in overall tone."
					);
				} else if (sentimentDivergence > 0.2) {
					keyPoints.push(
						"Some discrepancies exist between media portrayal and financial data."
					);
				} else {
					keyPoints.push(
						"Media narrative aligns reasonably well with financial reality."
					);
				}
			}

			// Ensure we have at least 2 key points
			if (keyPoints.length === 1) {
				keyPoints.push(
					"Consider both media narratives and official financial data when evaluating this company."
				);
			}

			// Calculate numerical score (0-100, higher = more divergence)
			const score = Math.min(100, Math.round(sentimentDivergence * 100));

			// Determine divergence level
			let divergence: "low" | "medium" | "high";
			if (score < 30) divergence = "low";
			else if (score < 60) divergence = "medium";
			else divergence = "high";

			// Generate summary
			let summary = "";
			if (divergence === "low") {
				summary = `Media narratives generally align with financial realities for ${company}.`;
			} else if (divergence === "medium") {
				summary = `Some notable differences exist between how ${company} is portrayed in media vs. financial data.`;
			} else {
				summary = `Significant divergence between media portrayal and financial reality for ${company}.`;
			}

			return {
				score,
				divergence,
				summary,
				keyPoints,
			};
		};

		// Set comparison data
		setComparison(calculateDivergence());
	}, [company, narratives, financialData]);

	if (!financialData || narratives.length === 0) {
		return null;
	}

	// Loading state
	if (isLoading) {
		return (
			<div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 shadow-lg p-5 animate-pulse">
				<div className="h-5 w-48 bg-gray-700 rounded mb-4"></div>
				<div className="space-y-3">
					<div className="h-4 w-full bg-gray-700 rounded"></div>
					<div className="h-4 w-5/6 bg-gray-700 rounded"></div>
					<div className="h-4 w-4/5 bg-gray-700 rounded"></div>
				</div>
			</div>
		);
	}

	// No comparison results
	if (!comparison) {
		return (
			<div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 shadow-lg p-5">
				<div className="flex items-center p-4 text-sm text-blue-300 rounded-lg bg-blue-900/20">
					<Info size={18} className="mr-3 flex-shrink-0" />
					<p>
						Analysis requires both media narrative and financial
						data to generate a comparison.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 shadow-lg">
			{/* Header with score */}
			<div className="px-5 py-4 border-b border-gray-700 bg-gray-800/80 flex justify-between items-center">
				<h3 className="text-lg font-medium text-white">
					Narrative-Reality Divergence
				</h3>

				<div className="flex items-center">
					<div
						className={`flex items-center justify-center w-12 h-12 rounded-full ${
							comparison.divergence === "low"
								? "bg-green-900/30 text-green-400"
								: comparison.divergence === "medium"
								? "bg-yellow-900/30 text-yellow-400"
								: "bg-red-900/30 text-red-400"
						}`}
					>
						<div className="text-lg font-bold">
							{Math.round(comparison.score)}
						</div>
					</div>
					<Percent
						size={14}
						className={`ml-1 ${
							comparison.divergence === "low"
								? "text-green-400"
								: comparison.divergence === "medium"
								? "text-yellow-400"
								: "text-red-400"
						}`}
					/>
				</div>
			</div>

			{/* Content */}
			<div className="p-5">
				{/* Summary */}
				<div className="mb-4">
					<p className="text-gray-200 text-sm">
						{comparison.summary}
					</p>
				</div>

				{/* Divergence indicator */}
				<div className="mb-4">
					<div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
						<div
							className={`absolute top-0 left-0 h-full rounded-full ${
								comparison.divergence === "low"
									? "bg-green-500"
									: comparison.divergence === "medium"
									? "bg-yellow-500"
									: "bg-red-500"
							}`}
							style={{ width: `${comparison.score}%` }}
						></div>
					</div>
					<div className="flex justify-between mt-1 text-xs text-gray-400">
						<span>Aligned</span>
						<span>Divergent</span>
					</div>
				</div>

				{/* Key points */}
				<div className="space-y-3 mt-4">
					<h4 className="text-sm font-medium text-gray-300">
						Key Observations:
					</h4>
					<ul className="space-y-2">
						{comparison.keyPoints.map((point, idx) => (
							<li key={idx} className="flex items-start">
								<div className="flex-shrink-0 mt-0.5 mr-2">
									{comparison.divergence === "low" ? (
										<TrendingDown
											size={16}
											className="text-green-400"
										/>
									) : comparison.divergence === "high" ? (
										<TrendingUp
											size={16}
											className="text-red-400"
										/>
									) : (
										<AlertTriangle
											size={16}
											className="text-yellow-400"
										/>
									)}
								</div>
								<span className="text-sm text-gray-300">
									{point}
								</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Footer */}
			<div className="px-4 py-2.5 border-t border-gray-700 bg-gray-800/70">
				<div className="flex items-center text-xs text-gray-400">
					<Info size={14} className="mr-1.5" />
					<span>
						Based on comparison of media narrative and official
						financial data
					</span>
				</div>
			</div>
		</div>
	);
}

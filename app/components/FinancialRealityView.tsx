"use client";

import { useFinancialReality } from "@/lib/useFinancialReality";
import { AlertTriangle } from "lucide-react";
import FinancialRealityCard from "./FinancialRealityCard";
import FinancialRealitySkeleton from "./FinancialRealitySkeleton";

interface FinancialRealityViewProps {
	company: string | null;
}

export default function FinancialRealityView({
	company,
}: FinancialRealityViewProps) {
	// Fetch financial data using our custom hook
	const { financialData, isLoading, error } = useFinancialReality(company);

	if (!company) {
		return null;
	}

	if (isLoading) {
		return <FinancialRealitySkeleton company={company} />;
	}

	if (error) {
		return (
			<div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 shadow-lg p-5">
				<div className="flex items-start p-4 text-sm text-red-300 rounded-lg bg-red-900/30">
					<AlertTriangle
						size={18}
						className="mr-3 flex-shrink-0 mt-0.5"
					/>
					<div>
						<p className="font-medium mb-1">
							Error fetching financial data
						</p>
						<p className="text-red-200/70">{error}</p>
						<p className="mt-2 text-gray-400">
							This could be due to limited availability of
							official financial data for {company}, or an issue
							with the data retrieval.
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (!financialData) {
		return (
			<div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 shadow-lg p-5">
				<div className="flex items-start p-4 text-sm text-yellow-300 rounded-lg bg-yellow-900/20">
					<AlertTriangle
						size={18}
						className="mr-3 flex-shrink-0 mt-0.5"
					/>
					<div>
						<p className="font-medium mb-1">
							No financial data available
						</p>
						<p className="text-gray-400">
							We couldn't find recent official financial
							information for {company}. This could be because
							it's a private company, a new listing, or our data
							sources don't have recent filings.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return <FinancialRealityCard data={financialData} />;
}

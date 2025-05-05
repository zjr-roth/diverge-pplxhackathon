"use client";

import { TrendingUp } from "lucide-react";

interface PopularCompaniesProps {
	onSelect: (company: string) => void;
	disabled?: boolean;
}

const POPULAR_COMPANIES = [
	{ symbol: "AAPL", name: "Apple" },
	{ symbol: "MSFT", name: "Microsoft" },
	{ symbol: "TSLA", name: "Tesla" },
	{ symbol: "NVDA", name: "NVIDIA" },
	{ symbol: "AMZN", name: "Amazon" },
	{ symbol: "META", name: "Meta" },
	{ symbol: "GOOG", name: "Google" },
];

export default function PopularCompanies({
	onSelect,
	disabled = false,
}: PopularCompaniesProps) {
	return (
		<div className="w-full">
			<div className="flex items-center gap-2 mb-3">
				<TrendingUp size={14} className="text-gray-400" />
				<span className="text-xs font-medium text-gray-400">
					Popular Companies
				</span>
			</div>

			<div className="flex flex-wrap gap-2">
				{POPULAR_COMPANIES.map((company) => (
					<button
						key={company.symbol}
						onClick={() => onSelect(company.symbol)}
						disabled={disabled}
						className="px-3 py-1.5 text-sm font-medium rounded-lg
                     bg-gray-800/70 hover:bg-gray-700
                     text-gray-300 hover:text-white
                     border border-gray-700 hover:border-gray-600
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{company.symbol}
					</button>
				))}
			</div>
		</div>
	);
}

"use client";

import { useState } from "react";
import {
	Copy,
	CheckCircle,
	TrendingUp,
	AlertTriangle,
	BarChart3,
	Calendar,
} from "lucide-react";
import type { FinancialReality } from "@/lib/sonarFinancial";

interface FinancialRealityCardProps {
	data: FinancialReality;
	className?: string;
}

export default function FinancialRealityCard({
	data,
	className = "",
}: FinancialRealityCardProps) {
	const [copied, setCopied] = useState(false);
	const [activeTab, setActiveTab] = useState<
		"fundamentals" | "risks" | "trends"
	>("fundamentals");

	// Format financial data for copying
	const copyText =
		`Financial Reality for ${data.company} (${data.source}, ${data.date}):\n\n` +
		`FUNDAMENTALS:\n${data.fundamentals
			.map((f) => `• ${f}`)
			.join("\n")}\n\n` +
		`RISKS:\n${data.risks.map((r) => `• ${r}`).join("\n")}\n\n` +
		`TRENDS:\n${data.trends.map((t) => `• ${t}`).join("\n")}`;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(copyText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case "fundamentals":
				return (
					<ul className="space-y-3">
						{data.fundamentals.map((item, idx) => (
							<li key={idx} className="flex items-start">
								<div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center rounded-full bg-blue-900/40 text-blue-400 text-sm font-medium">
									{idx + 1}
								</div>
								<span className="text-gray-200 leading-relaxed">
									{item}
								</span>
							</li>
						))}
					</ul>
				);
			case "risks":
				return (
					<ul className="space-y-3">
						{data.risks.map((item, idx) => (
							<li key={idx} className="flex items-start">
								<div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center rounded-full bg-red-900/40 text-red-400 text-sm font-medium">
									{idx + 1}
								</div>
								<span className="text-gray-200 leading-relaxed">
									{item}
								</span>
							</li>
						))}
					</ul>
				);
			case "trends":
				return (
					<ul className="space-y-3">
						{data.trends.map((item, idx) => (
							<li key={idx} className="flex items-start">
								<div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center rounded-full bg-green-900/40 text-green-400 text-sm font-medium">
									{idx + 1}
								</div>
								<span className="text-gray-200 leading-relaxed">
									{item}
								</span>
							</li>
						))}
					</ul>
				);
		}
	};

	return (
		<div
			className={`rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 shadow-lg ${className}`}
		>
			{/* Card header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/80">
				<h3 className="text-lg font-medium text-white flex items-center gap-2">
					<span className="text-blue-400">
						{data.company} Financial Reality
					</span>
					<span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-300">
						Official Data
					</span>
				</h3>

				<div className="flex items-center space-x-2">
					<button
						onClick={handleCopy}
						className="p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
						title="Copy to clipboard"
					>
						{copied ? (
							<CheckCircle size={18} className="text-green-500" />
						) : (
							<Copy size={18} />
						)}
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex border-b border-gray-700">
				<button
					onClick={() => setActiveTab("fundamentals")}
					className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
						activeTab === "fundamentals"
							? "border-blue-500 text-blue-400"
							: "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
					}`}
				>
					<BarChart3 size={16} />
					Fundamentals
				</button>
				<button
					onClick={() => setActiveTab("risks")}
					className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
						activeTab === "risks"
							? "border-red-500 text-red-400"
							: "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
					}`}
				>
					<AlertTriangle size={16} />
					Risks
				</button>
				<button
					onClick={() => setActiveTab("trends")}
					className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
						activeTab === "trends"
							? "border-green-500 text-green-400"
							: "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
					}`}
				>
					<TrendingUp size={16} />
					Trends
				</button>
			</div>

			{/* Card content */}
			<div className="p-5">{renderTabContent()}</div>

			{/* Card footer */}
			<div className="px-4 py-2.5 border-t border-gray-700 bg-gray-800/70">
				<div className="flex items-center text-xs text-gray-400">
					<Calendar size={14} className="mr-1.5" />
					<span>
						Source: {data.source} ({data.date})
					</span>
				</div>
			</div>
		</div>
	);
}

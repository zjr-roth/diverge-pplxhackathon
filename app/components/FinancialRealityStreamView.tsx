"use client";

import { useState, useRef, useEffect } from "react";
import {
	BarChart3,
	AlertTriangle,
	TrendingUp,
	Calendar,
	ExternalLink,
	Copy,
	CheckCircle,
	Loader2,
} from "lucide-react";
import { useFinancialStream } from "@/lib/useFinancialStream";

interface FinancialRealityStreamViewProps {
	company: string | null;
}

/**
 * Component to display streaming financial data
 * Mimics the structure of FinancialRealityCard but with streaming capabilities
 */
export default function FinancialRealityStreamView({
	company,
}: FinancialRealityStreamViewProps) {
	const [activeTab, setActiveTab] = useState<
		"fundamentals" | "risks" | "trends"
	>("fundamentals");
	const [copied, setCopied] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	// Use our custom hook to stream financial data
	const { financialData, rawContent, isLoading, isDone, error } =
		useFinancialStream(company);

	// Format financial data for copying
	const copyText = financialData
		? `Financial Reality for ${company}:\n\n` +
		  `FUNDAMENTALS:\n${financialData.fundamentals
				.map((f) => `• ${f}`)
				.join("\n")}\n\n` +
		  `RISKS:\n${financialData.risks.map((r) => `• ${r}`).join("\n")}\n\n` +
		  `TRENDS:\n${financialData.trends
				.map((t) => `• ${t}`)
				.join("\n")}\n\n` +
		  `Source: ${financialData.source}, Date: ${financialData.date}`
		: "";

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(copyText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Auto-scroll to bottom of content as new chunks arrive
	useEffect(() => {
		if (contentRef.current && isLoading) {
			contentRef.current.scrollTop = contentRef.current.scrollHeight;
		}
	}, [rawContent, isLoading]);

	// Helper function to extract source links from bullet points
	const extractSourceLink = (text: string) => {
		const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
		if (linkMatch) {
			return {
				text: text.substring(0, linkMatch.index).trim(),
				source: {
					title: linkMatch[1],
					url: linkMatch[2],
				},
			};
		}
		return { text, source: null };
	};

	// If no company is selected, don't render anything
	if (!company) {
		return null;
	}

	// Show error state
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
					</div>
				</div>
			</div>
		);
	}

	// Show loading/streaming state or completed state
	return (
		<div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 shadow-lg">
			{/* Card header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/80">
				<h3 className="text-lg font-medium text-white flex items-center gap-2">
					<span className="text-blue-400">
						{company} Financial Reality
					</span>
					<span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-300">
						Official Data
					</span>
				</h3>

				<div className="flex items-center space-x-2">
					<button
						onClick={handleCopy}
						disabled={!isDone}
						className="p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
			<div className="p-5 max-h-80 overflow-y-auto" ref={contentRef}>
				{isLoading && !financialData[activeTab]?.length ? (
					// Show loading state
					<div className="flex flex-col items-center justify-center py-8">
						<Loader2
							size={28}
							className="animate-spin text-blue-500 mb-3"
						/>
						<p className="text-gray-400 text-center">
							Retrieving financial data from official sources...
						</p>
					</div>
				) : (
					// Render the appropriate tab content
					<div>
						{activeTab === "fundamentals" && (
							<ul className="space-y-3">
								{/* Always display exactly 5 items */}
								{Array.from({ length: 5 }).map((_, idx) => {
									// Use real data if available, otherwise show placeholder or loading state
									const item =
										financialData.fundamentals[idx];

									if (!item) {
										return (
											<li
												key={idx}
												className="flex items-start"
											>
												<div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center rounded-full bg-blue-900/40 text-blue-400 text-sm font-medium">
													{idx + 1}
												</div>
												<div className="text-gray-200 leading-relaxed opacity-60">
													{isLoading ? (
														<div className="flex items-center">
															<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2"></div>
															<span>
																Loading
																fundamental
																data...
															</span>
														</div>
													) : isDone ? (
														"No additional information available"
													) : (
														""
													)}
												</div>
											</li>
										);
									}

									const { text, source } =
										extractSourceLink(item);
									return (
										<li
											key={idx}
											className="flex items-start"
										>
											<div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center rounded-full bg-blue-900/40 text-blue-400 text-sm font-medium">
												{idx + 1}
											</div>
											<div className="text-gray-200 leading-relaxed">
												<span>{text}</span>
												{source && (
													<a
														href={source.url}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center ml-1 text-blue-400 hover:underline"
													>
														<span className="text-xs font-medium">
															[Source
														</span>
														<ExternalLink
															size={10}
															className="ml-0.5 mr-0.5"
														/>
														<span className="text-xs font-medium">
															]
														</span>
													</a>
												)}
											</div>
										</li>
									);
								})}
							</ul>
						)}

						{activeTab === "risks" && (
							<ul className="space-y-3">
								{/* Always display exactly 5 items */}
								{Array.from({ length: 5 }).map((_, idx) => {
									// Use real data if available, otherwise show placeholder or loading state
									const item = financialData.risks[idx];

									if (!item) {
										return (
											<li
												key={idx}
												className="flex items-start"
											>
												<div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center rounded-full bg-red-900/40 text-red-400 text-sm font-medium">
													{idx + 1}
												</div>
												<div className="text-gray-200 leading-relaxed opacity-60">
													{isLoading ? (
														<div className="flex items-center">
															<div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
															<span>
																Loading risk
																data...
															</span>
														</div>
													) : isDone ? (
														"No additional risk information available"
													) : (
														""
													)}
												</div>
											</li>
										);
									}

									const { text, source } =
										extractSourceLink(item);
									return (
										<li
											key={idx}
											className="flex items-start"
										>
											<div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center rounded-full bg-red-900/40 text-red-400 text-sm font-medium">
												{idx + 1}
											</div>
											<div className="text-gray-200 leading-relaxed">
												<span>{text}</span>
												{source && (
													<a
														href={source.url}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center ml-1 text-red-400 hover:underline"
													>
														<span className="text-xs font-medium">
															[Source
														</span>
														<ExternalLink
															size={10}
															className="ml-0.5 mr-0.5"
														/>
														<span className="text-xs font-medium">
															]
														</span>
													</a>
												)}
											</div>
										</li>
									);
								})}
							</ul>
						)}

						{activeTab === "trends" && (
							<ul className="space-y-3">
								{/* Always display exactly 5 items */}
								{Array.from({ length: 5 }).map((_, idx) => {
									// Use real data if available, otherwise show placeholder or loading state
									const item = financialData.trends[idx];

									if (!item) {
										return (
											<li
												key={idx}
												className="flex items-start"
											>
												<div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center rounded-full bg-green-900/40 text-green-400 text-sm font-medium">
													{idx + 1}
												</div>
												<div className="text-gray-200 leading-relaxed opacity-60">
													{isLoading ? (
														<div className="flex items-center">
															<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
															<span>
																Loading trend
																data...
															</span>
														</div>
													) : isDone ? (
														"No additional trend information available"
													) : (
														""
													)}
												</div>
											</li>
										);
									}

									const { text, source } =
										extractSourceLink(item);
									return (
										<li
											key={idx}
											className="flex items-start"
										>
											<div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center rounded-full bg-green-900/40 text-green-400 text-sm font-medium">
												{idx + 1}
											</div>
											<div className="text-gray-200 leading-relaxed">
												<span>{text}</span>
												{source && (
													<a
														href={source.url}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center ml-1 text-green-400 hover:underline"
													>
														<span className="text-xs font-medium">
															[Source
														</span>
														<ExternalLink
															size={10}
															className="ml-0.5 mr-0.5"
														/>
														<span className="text-xs font-medium">
															]
														</span>
													</a>
												)}
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>
				)}
			</div>

			{/* Card footer */}
			<div className="px-4 py-2.5 border-t border-gray-700 bg-gray-800/70">
				<div className="flex items-center text-xs text-gray-400">
					<Calendar size={14} className="mr-1.5" />
					<span>
						{financialData.source
							? `Source: ${financialData.source}`
							: "Streaming financial data..."}
						{financialData.date ? ` (${financialData.date})` : ""}
					</span>
				</div>
			</div>

			{/* Streaming indicator */}
			{isLoading && (
				<div className="px-4 py-2 border-t border-gray-700 bg-gray-800/90 text-xs text-gray-400">
					<div className="flex items-center">
						<div className="flex space-x-1 mr-2">
							<div
								className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"
								style={{
									animationDuration: "1s",
									animationDelay: "0ms",
								}}
							></div>
							<div
								className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"
								style={{
									animationDuration: "1s",
									animationDelay: "300ms",
								}}
							></div>
							<div
								className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"
								style={{
									animationDuration: "1s",
									animationDelay: "600ms",
								}}
							></div>
						</div>
						<span>Streaming financial reality data...</span>
					</div>
				</div>
			)}
		</div>
	);
}

"use client";

import { useNarrativeStream } from "@/lib/useNarrativeStream";
import { useFinancialStream } from "@/lib/useFinancialStream";
import {
	Search,
	RefreshCw,
	AlertTriangle,
	Loader2,
	ExternalLink,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import PopularCompanies from "./PopularCompanies";
import NarrativeSkeleton from "./NarrativeSkeleton";
import NarrativeCard from "./NarrativeCard";
import FinancialRealityStreamView from "./FinancialRealityStreamView";
import NarrativeFinancialComparison from "./NarrativeFinancialComparison";

export default function NarrativeStreamView() {
	const [query, setQuery] = useState<string>("");
	const [company, setCompany] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Get streaming content using our custom hooks
	const { bulletPoints, rawContent, isLoading, isDone, error } =
		useNarrativeStream(company);
	const {
		financialData,
		rawContent: financialRawContent,
		isLoading: isFinancialLoading,
		isDone: isFinancialDone,
		error: financialError,
	} = useFinancialStream(company);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim()) return;
		setCompany(query.trim());
	};

	const handleReset = () => {
		setCompany(null);
		setQuery("");
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	// Auto-scroll to bottom of content as new chunks arrive
	const resultsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (resultsRef.current && (isLoading || isFinancialLoading)) {
			resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
		}
	}, [rawContent, financialRawContent, isLoading, isFinancialLoading]);

	return (
		<div className="flex flex-col w-full max-w-xl">
			{/* Search form */}
			<form onSubmit={handleSubmit} className="w-full mb-6">
				<div className="flex flex-col space-y-2">
					<label
						htmlFor="company"
						className="text-sm font-medium text-gray-200 mb-1"
					>
						Company or Ticker Symbol
					</label>

					<div className="relative flex items-center">
						<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
							<Search size={18} />
						</div>

						<input
							ref={inputRef}
							type="text"
							id="company"
							placeholder="TSLA, AAPL, Google, Meta, etc."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							disabled={isLoading || isFinancialLoading}
							className="flex-1 h-12 pl-10 pr-24 py-2 text-base rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     border-none
                     bg-gray-800/50
                     text-white placeholder-gray-400"
						/>

						<button
							type="submit"
							disabled={
								isLoading || isFinancialLoading || !query.trim()
							}
							className="absolute right-0 h-full px-5 text-base font-medium
                     bg-blue-600 hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     text-white rounded-r-lg transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading || isFinancialLoading ? (
								<Loader2 size={18} className="animate-spin" />
							) : (
								"Analyze"
							)}
						</button>
					</div>
				</div>
			</form>

			{/* Popular companies suggestions */}
			{!company && !isLoading && !isFinancialLoading && (
				<div className="mb-6">
					<PopularCompanies
						onSelect={(selected) => {
							setQuery(selected);
							setCompany(selected);
						}}
						disabled={isLoading || isFinancialLoading}
					/>
				</div>
			)}

			{/* Results display */}
			{(isLoading ||
				isFinancialLoading ||
				rawContent ||
				error ||
				financialError ||
				company) && (
				<div className="space-y-8">
					{/* Media Narrative Section */}
					<div>
						<h2 className="text-xl font-semibold text-white mb-3 flex items-center">
							<span className="w-1.5 h-5 bg-blue-500 rounded-sm mr-2"></span>
							Media Narrative
						</h2>

						{/* Narrative content */}
						{isLoading && !rawContent && !error ? (
							<NarrativeSkeleton company={company || ""} />
						) : isDone && bulletPoints.length > 0 && !error ? (
							<NarrativeCard
								company={company || ""}
								bulletPoints={bulletPoints}
							/>
						) : (
							<div
								ref={resultsRef}
								className="relative overflow-hidden rounded-xl border border-gray-700
                     bg-gray-800/50 shadow-lg"
							>
								{/* Header */}
								<div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/80">
									<h3 className="text-lg font-medium text-white">
										{company &&
											`Media Narratives: ${company.toUpperCase()}`}
									</h3>

									<div className="flex items-center space-x-2">
										{isDone && (
											<button
												onClick={handleReset}
												className="p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
												title="New search"
											>
												<RefreshCw size={18} />
											</button>
										)}
									</div>
								</div>

								{/* Content */}
								<div className="p-5">
									{error ? (
										<div className="flex items-center p-4 text-sm text-red-300 rounded-lg bg-red-900/30">
											<AlertTriangle
												size={18}
												className="mr-3 flex-shrink-0"
											/>
											<div>
												<p className="font-medium mb-1">
													Error connecting to
													Perplexity API
												</p>
												<p className="text-red-200/70">
													{error}
												</p>
											</div>
										</div>
									) : (
										<div className="space-y-4">
											{bulletPoints.length > 0 ? (
												<ul className="space-y-3">
													{bulletPoints.map(
														(bullet, idx) => (
															<li
																key={idx}
																className="flex items-start"
															>
																<div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center rounded-full bg-blue-900/40 text-blue-400 text-sm font-medium">
																	{idx + 1}
																</div>
																<div className="text-gray-200 leading-relaxed">
																	<span>
																		{
																			bullet.text
																		}
																	</span>
																	{bullet.source && (
																		<a
																			href={
																				bullet
																					.source
																					.url
																			}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="inline-flex items-center ml-1 text-blue-400 hover:underline"
																		>
																			<span className="text-xs font-medium">
																				[Source
																			</span>
																			<ExternalLink
																				size={
																					10
																				}
																				className="ml-0.5 mr-0.5"
																			/>
																			<span className="text-xs font-medium">
																				]
																			</span>
																		</a>
																	)}
																</div>
															</li>
														)
													)}
												</ul>
											) : (
												<div className="py-8 text-center text-gray-400">
													<Loader2
														size={28}
														className="mx-auto mb-3 animate-spin text-blue-500"
													/>
													<p>
														Searching across news,
														blogs, Twitter, and
														YouTube...
													</p>
												</div>
											)}
										</div>
									)}
								</div>

								{/* Footer with streaming indicator */}
								{isLoading && !error && (
									<div className="px-4 py-2 border-t border-gray-700 bg-gray-800 text-xs text-gray-400">
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
											<span>
												Streaming results as they
												arrive...
											</span>
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Financial Reality Section */}
					{company && (
						<div>
							<h2 className="text-xl font-semibold text-white mb-3 flex items-center">
								<span className="w-1.5 h-5 bg-green-500 rounded-sm mr-2"></span>
								Financial Reality
							</h2>
							<FinancialRealityStreamView company={company} />
						</div>
					)}

					{/* Comparison Section - only show when we have both narrative and financial data */}
					{company &&
						isDone &&
						!error &&
						isFinancialDone &&
						!financialError &&
						bulletPoints.length > 0 && (
							<div>
								<h2 className="text-xl font-semibold text-white mb-3 flex items-center">
									<span className="w-1.5 h-5 bg-purple-500 rounded-sm mr-2"></span>
									Narrative vs Reality
								</h2>
								<NarrativeFinancialComparison
									company={company}
									narratives={bulletPoints.map(
										(bp) => bp.text
									)}
									financialData={{
										...financialData,
										company: company || "",
									}}
									isLoading={isLoading || isFinancialLoading}
								/>
							</div>
						)}

					{/* Reset button for completed searches */}
					{isDone &&
						isFinancialDone &&
						!isLoading &&
						!isFinancialLoading && (
							<div className="flex justify-center mt-8">
								<button
									onClick={handleReset}
									className="px-4 py-2 text-sm font-medium text-blue-400 border border-blue-900/50
                      rounded-lg hover:bg-blue-900/20 transition-colors"
								>
									<RefreshCw
										size={14}
										className="inline mr-2"
									/>
									New Analysis
								</button>
							</div>
						)}
				</div>
			)}
		</div>
	);
}

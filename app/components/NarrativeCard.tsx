"use client";

import { useState } from "react";
import { Share2, Copy, CheckCircle2 } from "lucide-react";

interface NarrativeCardProps {
	company: string;
	narratives: string[];
	className?: string;
}

export default function NarrativeCard({
	company,
	narratives,
	className = "",
}: NarrativeCardProps) {
	const [copied, setCopied] = useState(false);

	// Format narratives for copying
	const copyText = `Media Narratives for ${company}:\n\n${narratives
		.map((n) => `• ${n}`)
		.join("\n")}`;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(copyText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<div
			className={`rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm ${className}`}
		>
			{/* Card header */}
			<div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/20 dark:to-purple-900/20">
				<div className="flex justify-between items-center">
					<h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
						<span className="text-blue-600 dark:text-blue-400">
							{company.toUpperCase()}
						</span>
						<span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
							Media Narrative
						</span>
					</h3>

					<button
						onClick={handleCopy}
						className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
						title="Copy to clipboard"
					>
						{copied ? (
							<CheckCircle2
								size={16}
								className="text-green-500"
							/>
						) : (
							<Copy size={16} />
						)}
					</button>
				</div>
			</div>

			{/* Card content */}
			<div className="p-4">
				<ul className="space-y-3">
					{narratives.map((narrative, index) => (
						<li key={index} className="flex items-start gap-3">
							<div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
								{index + 1}
							</div>
							<span className="text-gray-700 dark:text-gray-300">
								{narrative}
							</span>
						</li>
					))}
				</ul>
			</div>

			{/* Card footer */}
			<div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
				<div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
					<Share2 size={12} className="mr-1" />
					<span>Generated {new Date().toLocaleDateString()}</span>
				</div>
			</div>
		</div>
	);
}

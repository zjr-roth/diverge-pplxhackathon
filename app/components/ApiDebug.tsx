"use client";

import { useState } from "react";

interface DebugInfo {
	apiKey: string;
	url: string;
	timestamp: string;
}

export default function ApiDebug() {
	const [showDebug, setShowDebug] = useState(false);
	const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const checkApiConnection = async () => {
		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/debug");

			if (!res.ok) {
				throw new Error(`HTTP error ${res.status}`);
			}

			const data = await res.json();
			setDebugInfo(data);
		} catch (err: any) {
			console.error("Debug check failed:", err);
			setError(err.message || "Failed to check API connection");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed bottom-4 left-4 z-50">
			<button
				onClick={() => setShowDebug(!showDebug)}
				className="p-2 bg-gray-800 text-gray-400 rounded-full hover:bg-gray-700 hover:text-gray-300"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 5v14"></path>
					<path d="M5 12h14"></path>
				</svg>
			</button>

			{showDebug && (
				<div className="absolute bottom-12 left-0 w-72 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
					<h3 className="text-sm font-medium text-gray-300 mb-3">
						API Connection Debug
					</h3>

					<button
						onClick={checkApiConnection}
						disabled={loading}
						className="w-full py-2 px-3 text-xs font-medium rounded mb-3
                     bg-blue-900/50 hover:bg-blue-800
                     text-blue-300 hover:text-blue-200
                     border border-blue-900/70
                     disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Checking..." : "Check API Connection"}
					</button>

					{error && (
						<div className="mb-3 p-2 text-xs text-red-300 bg-red-900/30 rounded border border-red-900/50">
							{error}
						</div>
					)}

					{debugInfo && (
						<div className="space-y-2 text-xs">
							<div className="flex justify-between">
								<span className="text-gray-400">
									API Key Status:
								</span>
								<span
									className={
										debugInfo.apiKey === "valid"
											? "text-green-400"
											: "text-red-400"
									}
								>
									{debugInfo.apiKey === "valid"
										? "✓ Valid"
										: "✗ Invalid"}
								</span>
							</div>

							<div className="flex justify-between">
								<span className="text-gray-400">API URL:</span>
								<span className="text-gray-300">
									{debugInfo.url}
								</span>
							</div>

							<div className="text-gray-500 text-xs mt-2">
								Last checked:{" "}
								{new Date(
									debugInfo.timestamp
								).toLocaleTimeString()}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

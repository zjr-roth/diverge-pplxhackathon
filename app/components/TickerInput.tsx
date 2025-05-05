"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Accepts 1–5 uppercase letters (standard US ticker format)
const TICKER_REGEX = /^[A-Z]{1,5}$/;

export default function TickerInput() {
	const [ticker, setTicker] = useState("");
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const symbol = ticker.trim().toUpperCase();

		if (!TICKER_REGEX.test(symbol)) {
			setError("Please enter a valid ticker (1–5 capital letters).");
			return;
		}

		setError(null);
		// Navigate to the analysis route; backend fetch will trigger there
		router.push(`/analyze/${symbol}`);
	};

	return (
		<form onSubmit={handleSubmit} className="w-full max-w-md">
			<label htmlFor="ticker" className="block mb-2 text-lg font-medium">
				Enter a stock ticker
			</label>

			<div className="flex">
				<input
					id="ticker"
					name="ticker"
					type="text"
					value={ticker}
					onChange={(e) => setTicker(e.target.value.toUpperCase())}
					placeholder="e.g. TSLA"
					className="flex-grow rounded-l-md border border-gray-300 p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
				/>
				<button
					type="submit"
					className="rounded-r-md bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Search
				</button>
			</div>

			{error && (
				<p className="mt-2 text-sm text-red-600 dark:text-red-400">
					{error}
				</p>
			)}
		</form>
	);
}

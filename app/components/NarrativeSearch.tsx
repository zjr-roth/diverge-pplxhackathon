// components/NarrativeSearch.tsx
"use client";

import { useState } from "react";
import { useNarrative } from "@/lib/useNarrative";
import { ArrowRight } from "lucide-react";

export default function NarrativeSearch() {
	const [query, setQuery] = useState("");
	const [company, setCompany] = useState<string | null>(null);

	// Call SWR only when we have a company selected
	const { data, error, isLoading } = useNarrative(company ?? "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim()) return;
		setCompany(query.trim());
	};

	return (
		<div className="flex flex-col gap-6">
			{/* --- Search bar --- */}
			<form
				onSubmit={handleSubmit}
				className="flex items-center gap-2 w-full max-w-md"
			>
				<input
					type="text"
					placeholder="e.g. TSLA or Tesla"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="flex-1 rounded-xl border px-4 py-2"
				/>
				<button
					type="submit"
					className="rounded-xl border px-4 py-2 flex items-center gap-1 shadow hover:bg-gray-50"
				>
					Search <ArrowRight size={16} />
				</button>
			</form>

			{/* --- Results --- */}
			{isLoading && <p className="animate-pulse">Fetching narrative…</p>}

			{error && (
				<p className="text-red-600">
					Oops — couldn’t fetch narrative. Try again in a minute.
				</p>
			)}

			{data && (
				<div className="rounded-2xl border p-4 shadow-lg max-w-2xl">
					<h2 className="text-xl font-semibold mb-3">
						Media narrative for {data.company}
					</h2>
					<ul className="list-disc ml-5 space-y-1">
						{data.narratives.map((n: string, idx: number) => (
							<li key={idx}>{n}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

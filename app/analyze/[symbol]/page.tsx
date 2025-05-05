interface Params {
	symbol: string;
}

export default async function AnalyzePage({ params }: { params: Params }) {
	const { symbol } = params;

	return (
		<main className="p-6">
			<h2 className="text-2xl font-semibold">
				Analysis for{" "}
				<span className="font-mono uppercase">{symbol}</span>
			</h2>
			<p className="mt-4 text-gray-600 dark:text-gray-400">
				Fetching narrative &amp; fundamentals… (coming soon)
			</p>
		</main>
	);
}

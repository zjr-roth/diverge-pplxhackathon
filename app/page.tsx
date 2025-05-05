import NarrativeStreamView from "./components/NarrativeStreamView";
import ApiDebug from "./components/ApiDebug";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900 text-white">
			<div className="w-full max-w-2xl space-y-8">
				{/* Header */}
				<div className="text-center mb-4">
					<h1 className="text-4xl font-bold tracking-tight text-white mb-2">
						Narrative Check
					</h1>
					<p className="text-gray-400">
						Discover how media portrays companies vs. financial
						reality
					</p>
				</div>

				{/* Main content */}
				<NarrativeStreamView />

				{/* Footer/info */}
				<div className="mt-8 text-center text-xs text-gray-500">
					<p>
						Powered by Perplexity Sonar API • Compare narratives
						with financial data
					</p>
				</div>
			</div>

			{/* API Debug Tool (only visible in development) */}
			{process.env.NODE_ENV === "development" && <ApiDebug />}
		</main>
	);
}

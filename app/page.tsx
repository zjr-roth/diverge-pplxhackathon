import NarrativeSearch from "./components/NarrativeSearch";
import TickerInput from "./components/TickerInput";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
			<h1 className="mb-8 text-3xl font-bold tracking-tight">
				Narrative Check
			</h1>
			<NarrativeSearch />
		</main>
	);
}

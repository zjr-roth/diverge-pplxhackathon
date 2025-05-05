"use client";

/**
 * Animated skeleton UI for financial reality loading state
 */
export default function FinancialRealitySkeleton({
	company,
}: {
	company: string;
}) {
	return (
		<div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 shadow-lg animate-pulse">
			{/* Card header */}
			<div className="px-4 py-3 border-b border-gray-700 bg-gray-800/80 flex justify-between">
				<div className="h-6 w-56 bg-gray-700 rounded"></div>
				<div className="h-6 w-8 bg-gray-700 rounded"></div>
			</div>

			{/* Tabs */}
			<div className="flex border-b border-gray-700 px-4 py-2.5">
				<div className="h-5 w-28 bg-gray-700 rounded mr-4"></div>
				<div className="h-5 w-20 bg-gray-700 rounded mr-4"></div>
				<div className="h-5 w-24 bg-gray-700 rounded"></div>
			</div>

			{/* Card content */}
			<div className="p-5 space-y-4">
				<div className="flex items-center space-x-3">
					<div className="h-6 w-6 rounded-full bg-blue-900/30"></div>
					<div className="h-4 w-full bg-gray-700 rounded"></div>
				</div>

				<div className="flex items-center space-x-3">
					<div className="h-6 w-6 rounded-full bg-blue-900/30"></div>
					<div className="h-4 w-5/6 bg-gray-700 rounded"></div>
				</div>

				<div className="flex items-center space-x-3">
					<div className="h-6 w-6 rounded-full bg-blue-900/30"></div>
					<div className="h-4 w-4/5 bg-gray-700 rounded"></div>
				</div>

				<div className="flex items-center space-x-3 opacity-70">
					<div className="h-6 w-6 rounded-full bg-blue-900/30"></div>
					<div className="h-4 w-3/4 bg-gray-700 rounded"></div>
				</div>
			</div>

			{/* Card footer */}
			<div className="px-4 py-2.5 border-t border-gray-700 bg-gray-800/70">
				<div className="h-3 w-48 bg-gray-700 rounded"></div>
			</div>
		</div>
	);
}

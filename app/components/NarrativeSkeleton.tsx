"use client";

/**
 * Animated skeleton UI for narrative loading state
 */
export default function NarrativeSkeleton({ company }: { company: string }) {
	return (
		<div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm animate-pulse">
			{/* Card header */}
			<div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between">
				<div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
				<div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
			</div>

			{/* Card content */}
			<div className="p-4 space-y-4">
				<div className="flex items-center space-x-3">
					<div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30"></div>
					<div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
				</div>

				<div className="flex items-center space-x-3">
					<div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30"></div>
					<div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
				</div>

				<div className="flex items-center space-x-3">
					<div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30"></div>
					<div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
				</div>

				<div className="flex items-center space-x-3 opacity-70">
					<div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30"></div>
					<div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
				</div>
			</div>

			{/* Card footer */}
			<div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
				<div className="flex items-center space-x-2">
					<div className="h-3 w-3 rounded-full bg-blue-400 dark:bg-blue-500 animate-pulse"></div>
					<div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
				</div>
			</div>
		</div>
	);
}

// hooks/useAsyncAction.ts
import { useCallback, useState } from "react";

/**
 * A reusable async handler with loading state and stopPropagation support.
 * It returns:
 *   - run(e?, ...args): handles stopPropagation + executes the action
 *   - isLoading: boolean
 */
export function useAsyncAction<TArgs extends any[]>(action: (...args: TArgs) => Promise<void>) {
	const [isLoading, setIsLoading] = useState(false);

	const run = useCallback(
		async (e?: React.MouseEvent, ...args: TArgs) => {
			// Safely stop propagation if an event is passed
			if (e && "stopPropagation" in e) {
				e.stopPropagation();
			}

			setIsLoading(true);
			try {
				await action(...args);
			} finally {
				setIsLoading(false);
			}
		},
		[action],
	);

	return { run, isLoading };
}

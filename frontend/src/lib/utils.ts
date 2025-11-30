// frontend/src/lib/utils.ts

/**
 * Combine multiple class names into a single string, ignoring falsy values.
 *
 * Useful for conditional CSS classes, e.g., Tailwind or dynamic styling.
 *
 * @param classes - An array of strings or falsy values (`undefined`, `null`, `false`) to combine
 * @returns A single string of classes separated by spaces
 *
 * @example
 * ```ts
 * cn("btn", isPrimary && "btn-primary", null, "mt-4");
 * // => "btn btn-primary mt-4"
 * ```
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
	return classes.filter(Boolean).join(" ");
}

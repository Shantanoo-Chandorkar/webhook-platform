import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Maps HTTP methods to their semantic colour classes. These are chosen to
 * match developer conventions (GET = blue, POST = green, etc.) so the method
 * can be recognised at a glance in the request list.
 */
const METHOD_STYLES = {
	GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
	POST: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
	PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
	PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
	DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const DEFAULT_STYLE =
	'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';

/**
 * Colour-coded badge displaying an HTTP method.
 *
 * @param {{ method: string, className?: string }} props
 */
export function MethodBadge({ method, className }) {
	const colourClass = METHOD_STYLES[method?.toUpperCase()] ?? DEFAULT_STYLE;

	return (
		<Badge
			variant="outline"
			className={cn(
				'border-transparent font-mono text-xs font-semibold px-1.5 py-0',
				colourClass,
				className,
			)}
		>
			{method}
		</Badge>
	);
}

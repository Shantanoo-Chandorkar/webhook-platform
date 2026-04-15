import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Renders a request body with format-appropriate presentation.
 *
 * Security note: user-controlled content is NEVER injected as HTML. All
 * output goes into <pre> or table cells as plain text, which React escapes
 * automatically.
 *
 * @param {{ body: string|null, contentType: string }} props
 */
export function JsonViewer({ body, contentType }) {
	const [copied, setCopied] = useState(false);

	if (!body) {
		return (
			<div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
				No body
			</div>
		);
	}

	async function handleCopy() {
		await navigator.clipboard.writeText(body);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	const type = contentType?.toLowerCase() ?? '';
	const rendered = renderBody(body, type);

	return (
		<div className="relative">
			<Button
				variant="ghost"
				size="sm"
				onClick={handleCopy}
				className="absolute top-2 right-2 text-xs h-7 z-10"
			>
				{copied ? 'Copied!' : 'Copy'}
			</Button>
			{rendered}
		</div>
	);
}

/**
 * Selects the correct rendering strategy based on Content-Type.
 *
 * Falls back to raw text display on any parse failure so that malformed
 * payloads don't crash the UI.
 *
 * @param {string} body
 * @param {string} contentType - Lowercased content-type header value
 * @returns {JSX.Element}
 */
function renderBody(body, contentType) {
	if (contentType.includes('application/json')) {
		try {
			const parsed = JSON.parse(body);
			const pretty = JSON.stringify(parsed, null, 2);
			return <PrettyPre text={pretty} />;
		} catch {
			// JSON.parse failed — fall through to raw display
		}
	}

	if (contentType.includes('application/x-www-form-urlencoded')) {
		try {
			const params = new URLSearchParams(body);
			const entries = [...params.entries()];
			if (entries.length > 0) {
				return <KeyValueTable rows={entries} />;
			}
		} catch {
			// Malformed URL-encoded data — fall through to raw display
		}
	}

	return <PrettyPre text={body} />;
}

/**
 * Renders text inside a scrollable pre block using the monospace font.
 *
 * @param {{ text: string }} props
 */
function PrettyPre({ text }) {
	return (
		<pre className="text-xs font-mono bg-muted/50 rounded-md p-4 overflow-auto max-h-[400px] whitespace-pre-wrap break-all text-foreground leading-relaxed">
			{text}
		</pre>
	);
}

/**
 * Renders key-value pairs as a two-column table (used for form-encoded bodies).
 *
 * @param {{ rows: [string, string][] }} props
 */
function KeyValueTable({ rows }) {
	return (
		<div className="overflow-auto max-h-[400px] rounded-md border border-border">
			<table className="w-full text-xs">
				<thead>
					<tr className="bg-muted/50 border-b border-border">
						<th className="px-3 py-2 text-left font-medium text-muted-foreground w-1/3">
							Key
						</th>
						<th className="px-3 py-2 text-left font-medium text-muted-foreground">
							Value
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map(([key, value], index) => (
						<tr key={index} className="border-b border-border last:border-0">
							<td className="px-3 py-2 font-mono text-foreground font-medium">{key}</td>
							<td className="px-3 py-2 font-mono text-muted-foreground break-all">
								{value}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

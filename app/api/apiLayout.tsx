import type { Route } from "./+types/apiLayout";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "API Endpoints" },
		{ name: "description", content: "List of available API endpoints" },
	];
}

export default function ApiLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">API Endpoints</h1>
			{children}
		</div>
	);
}

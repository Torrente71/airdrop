import axios from "axios";
import type { Route } from "./+types/file";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "File Details" },
		{ name: "description", content: "Details of a specific file" },
	];
}

export async function loader({ params }: Route.LoaderArgs) {
	const { cid } = params;

	if (!cid) {
		throw new Response("CID is required", { status: 400 });
	}

	const FILE_URL = new URL(`${import.meta.env.VITE_GATEWAY_URL}/${cid}`);

	try {
		const res = await axios.get(FILE_URL.toString());

		console.log(res.data);
		return res.data;
	} catch (err) {
		console.error("Error fetching file details:", err);
		throw new Response("Failed to fetch file details", { status: 500 });
	}
}

export default function File({ loaderData }: Route.ComponentProps) {
	const fileData = loaderData;
	return JSON.stringify({ fileData });
}

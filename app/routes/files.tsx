import { useState } from "react";
import { useFetcher, useNavigate, useNavigation } from "react-router";
import axios, { AxiosError } from "axios";

import type { Route } from "./+types/files";
import { config } from "~/config";

type PinataFile = {
	id: string;
	name: string;
	cid: string;
	size: number;
	number_of_files: number;
	mime_type: string;
	group_id: string;
	keyvalues: Record<string, string>;
	created_at: string;
};

type FilesData = {
	files: PinataFile[];
	next_page_token: string | null;
};

type FileUploadResult<T, E> = {
	success: boolean;
	data?: T;
	error?: E;
};

type FileUploadData = {
	id: string;
	name: string;
	cid: string;
	created_at: string;
	size: number;
	number_of_files: number;
	mime_type: string;
	user_id: string;
	group_id: string;
	is_duplicate: boolean;
};

type FileUploadStatus = FileUploadResult<FileUploadData, string>;

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Kintsu Points" },
		{ name: "description", content: "Kintsu points leaderboard" },
	];
}

export async function loader(): Promise<FilesData> {
	const FILES_URL = `https://api.pinata.cloud/v3/files/public?group=${config.PINATA_GROUP_ID}`;

	try {
		const res = await axios.get(FILES_URL, {
			headers: {
				Authorization: `Bearer ${config.PINATA_ACCESS_TOKEN}`,
			},
		});
		return res.data.data as FilesData;
	} catch (err) {
		return {
			files: [],
			next_page_token: null,
		} as FilesData;
	}
}

export async function action({
	request,
}: Route.ActionArgs): Promise<FileUploadStatus> {
	const UPLOAD_URL = "https://uploads.pinata.cloud/v3/files";

	const data = await request.json();
	const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
	const file = new File([blob], "data2.json"); // TODO: figure out filename

	const groupId = config.PINATA_GROUP_ID || "";

	const form = new FormData();
	form.append("network", "public");
	form.append("file", file);
	form.append("group_id", groupId);
	form.append("keyvalues", JSON.stringify({ is_hidden: String(false) }));

	try {
		const res = await axios.post(UPLOAD_URL, form, {
			headers: {
				Authorization: `Bearer ${config.PINATA_ACCESS_TOKEN}`,
			},
		});
		return { success: true, data: res.data.data } as FileUploadStatus;
	} catch (err: AxiosError | any) {
		console.log(err.response?.data);
		return {
			success: false,
			error: err.response?.data?.error.message || "Failed to upload file",
		} as FileUploadStatus;
	}
}

export default function Files({ loaderData }: Route.ComponentProps) {
	const fetcher = useFetcher<FileUploadStatus>();
	const navigate = useNavigate();
	const navigation = useNavigation();
	const isNavigation = Boolean(navigation.location);

	const [files, setFiles] = useState<FilesData>(loaderData!);

	const handleUpload = () => {
		const data = {
			leaderboard: loaderData,
			timestamp: Date.now(),
		};

		fetcher.submit(JSON.stringify(data), {
			method: "post",
			encType: "application/json",
		});
	};

	if (isNavigation) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="h-10 w-10 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
			</div>
		);
	}

	return (
		<>
			<h1 className="text-2xl font-bold mb-6">Files</h1>

			{/* Top Action Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<button
					onClick={handleUpload}
					disabled={fetcher.state === "submitting"}
					className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
						fetcher.state === "submitting"
							? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-60"
							: "bg-blue-600 text-white hover:bg-blue-700"
					}`}
				>
					{fetcher.state === "submitting"
						? "Uploading..."
						: "Upload to IPFS"}
				</button>

				<div className="text-sm">
					{fetcher.state === "submitting" && (
						<p className="text-yellow-400">Uploading...</p>
					)}

					{fetcher.data?.success && fetcher.data?.data?.cid && (
						<p className="text-green-400 break-all">
							CID: {fetcher.data.data.cid}
						</p>
					)}
					{!fetcher.data?.success && fetcher.data?.error && (
						<p className="text-red-400 break-all">
							Error: {fetcher.data.error}
						</p>
					)}
				</div>
			</div>

			{/* Files Grid */}
			<ul className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
				{files.files.map((file) => (
					<li
						key={file.id}
						className="bg-gray-900 text-white p-5 rounded-xl shadow-md border border-gray-800"
					>
						<div className="space-y-2 text-sm">
							<p>
								<span className="font-semibold text-gray-400">
									Name:
								</span>{" "}
								{file.name}
							</p>

							<p>
								<span className="font-semibold text-gray-400">
									CID:
								</span>{" "}
								<span className="break-all">{file.cid}</span>
							</p>

							<p>
								<span className="font-semibold text-gray-400">
									Size:
								</span>{" "}
								{file.size.toLocaleString()} bytes
							</p>

							<p>
								<span className="font-semibold text-gray-400">
									Group ID:
								</span>{" "}
								{file.group_id}
							</p>

							<p>
								<span className="font-semibold text-gray-400">
									Created:
								</span>{" "}
								{new Date(file.created_at).toLocaleString()}
							</p>
						</div>
					</li>
				))}
			</ul>
		</>
	);
}

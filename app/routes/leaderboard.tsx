import {
	useFetcher,
	useLoaderData,
	useNavigate,
	useNavigation,
	useRevalidator,
} from "react-router";
import axios from "axios";
import { AxiosError } from "axios";

import type { Route } from "./+types/leaderboard";
import { config } from "~/config";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Kintsu Leaderboard" },
		{
			name: "description",
			content: "Kintsu leaderboard showing top users by points",
		},
	];
}

type UserPoints = {
	id: string;
	percentile: string;
	ranking: number;
	totalPoints: string;
};

type KintsuLeaderboard = {
	User_Points: UserPoints[];
};

function shortenAddress(address: string, start = 5, end = 5) {
	if (!address) return "";
	return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export async function loader() {
	try {
		const response = await axios.post(
			"https://kintsu.xyz/api/graphql",
			{
				chainId: 143,
				body: {
					query: `
                        query PointsLeadboard($limit: Int, $offset: Int, $orderBy: [User_Points_order_by!]) {
                        User_Points(
                            where: { ranking: { _gt: 0 } }
                            order_by: $orderBy
                            limit: $limit
                            offset: $offset
                        ) {
                            id
                            percentile
                            ranking
                            totalPoints
                        }
                        }
                    `,
					variables: {
						limit: 1000,
						offset: 0,
						orderBy: [{ totalPoints: "desc" }, { id: "asc" }],
					},
				},
			},
			{
				headers: {
					"Content-Type": "text/plain;charset=UTF-8",
					Origin: "https://kintsu.xyz",
					Referer: "https://kintsu.xyz/points",
				},
			},
		);

		const addressRes = await axios.get(
			config.GATEWAY_URL! +
				"/bafkreigiiw7xg3omjl22qca25zwqhguwlxlit2txffrmcfgptly3ubq7qm",
		);

		const allowedAddresses = new Set(
			addressRes.data.addresses.map((addr: string) => addr.toLowerCase()),
		);

		console.log(allowedAddresses);
		response.data.data.User_Points = response.data.data.User_Points.filter(
			(user: UserPoints) => allowedAddresses.has(user.id),
		);

		console.log(response.data.data.User_Points);
		return response.data.data.User_Points;
	} catch (error: AxiosError | any) {
		console.error(error.response?.data || error.message);
	}
}

export async function action({ request }: Route.ActionArgs) {}

export default function Leaderboard() {
	const data = useLoaderData<typeof loader>();
	const { revalidate, state } = useRevalidator();
	const fetcher = useFetcher();
	const navigate = useNavigate();
	const navigation = useNavigation();

	// const [posts, setPosts] = useState<>(loaderData)

	const isNavigation = Boolean(navigation.location);

	// const handleUpload = () => {
	// 	const data = {
	// 		leaderboard: loaderData,
	// 		timestamp: Date.now(),
	// 	};

	// 	fetcher.submit(JSON.stringify(data), {
	// 		method: "post",
	// 		encType: "application/json",
	// 	});
	// };

	if (isNavigation) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="h-10 w-10 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-white">
					Kintsu Leaderboard
				</h1>

				<button
					onClick={() => revalidate()}
					className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition"
				>
					{state === "loading" ? "Refreshing..." : "Refresh"}
				</button>
			</div>

			<ul className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
				{data.map((user: UserPoints) => (
					<li
						key={user.id}
						className="bg-gray-900 text-white p-5 rounded-xl shadow-md border border-gray-800"
					>
						<p>{shortenAddress(user.id)}</p>
						<div className="space-y-2 text-sm">
							<p>
								<span className="font-semibold text-gray-400">
									Rank:
								</span>{" "}
								#{user.ranking}
							</p>

							<p>
								<span className="font-semibold text-gray-400">
									Total Points:
								</span>{" "}
								{user.totalPoints.toLocaleString()}
							</p>

							<p>
								<span className="font-semibold text-gray-400">
									Percentile:
								</span>{" "}
								{user.percentile}%
							</p>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}

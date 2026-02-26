import {
	type RouteConfig,
	index,
	layout,
	prefix,
	route,
} from "@react-router/dev/routes";

export default [
	index("routes/leaderboard.tsx"),
	route("file/:cid", "routes/file.tsx"),
	route("files", "routes/files.tsx"),

	...prefix("api", [
		layout("api/apiLayout.tsx", [
			// index("api/index.tsx"),
			route("upload", "api/upload.tsx"),
		]),
	]),
] satisfies RouteConfig;

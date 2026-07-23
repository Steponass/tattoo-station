import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("artists", "routes/artists.tsx"),
  route("media/*", "routes/media.$.tsx"),
  route("booking", "routes/booking.tsx"),
  route("api/booking-photos", "routes/api.booking-photos.ts"),
] satisfies RouteConfig;
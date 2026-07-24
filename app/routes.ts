import {
  type RouteConfig,
  route,
  index,
  prefix,
} from "@react-router/dev/routes";

export default [
 ...prefix("/:lang?", [
    index("routes/home.tsx"),
    route("artists", "routes/artists.tsx"),
    route("media/*", "routes/media.$.tsx"),
    route("booking", "routes/booking.tsx"),
    route("api/booking-photos", "routes/api.booking-photos.ts"),
    route("piercing", "routes/piercing/piercing.tsx"),
  ]),
] satisfies RouteConfig;

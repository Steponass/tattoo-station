import {
  type RouteConfig,
  route,
  index,
  prefix,
} from "@react-router/dev/routes";

export default [
 ...prefix("/:lang?", [
    index("routes/home/home.tsx"),
    route("artists", "routes/artists/artists.tsx"),
    route("artists/:slug", "routes/artistPage/artists.$slug.tsx"),
    route("media/*", "routes/media.$.tsx"),
    route("booking", "routes/booking.tsx"),
    route("api/booking-photos", "routes/api.booking-photos.ts"),
    route("piercing", "routes/piercing/piercing.tsx"),
    route("aftercare", "routes/aftercare/aftercare.tsx"),
    route("aftercare/aftercarePiercing", "routes/aftercare/aftercarePiercing/aftercarePiercing.tsx"),
    route("aftercare/aftercareTattoo", "routes/aftercare/aftercareTattoo/aftercareTattoo.tsx"),
    route("flashdesigns", "./routes/flashdesigns/flashdesigns.tsx"),
    route("tattoostyles", "routes/tattoostyles/tattoostyles.tsx"),
    route("faq", "routes/faq/faq.tsx"),
    route("coupon", "routes/coupon/coupon.tsx"),
    route("api/artist-photos", "routes/api.artist-photos.ts"),
    route("portfolio-image/*", "routes/portfolio-image.$.tsx"),
    route("api/artist-avatar", "routes/api.artist-avatar.ts"),
  ]),
    route("admin", "routes/admin.tsx", [
    route("me", "routes/admin.me.tsx"),
  ]),
] satisfies RouteConfig;

import { createRequestHandler, RouterContextProvider } from "react-router";

import { cloudflareContext } from "~/lib/cloudflare/cloudflareContext";
import { shuffleStyleGalleryOrder } from "~/lib/gallery/shuffleStyleGalleryOrder.server";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const routerContext = new RouterContextProvider();
    routerContext.set(cloudflareContext, { env, ctx });

    return requestHandler(request, routerContext);
  },

  // Monthly /tattoostyles reshuffle — see wrangler.jsonc's triggers.crons
  // and shuffleStyleGalleryOrder.server.ts for why this is a dedicated
  // column rather than a reuse of artist_photos.sort_order.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(shuffleStyleGalleryOrder({ database: env.DB }));
  },
} satisfies ExportedHandler<Env>;
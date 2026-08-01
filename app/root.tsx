import {
  data,
  useLoaderData,
  useLocation,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import './styles/css-reset.css'
import './styles/fonts.css'
import './styles/variables.css'
import './styles/global.css'
import './styles/page-transitions.css'

import { getLocaleFromPath } from "intlayer";
import { IntlayerProvider } from "react-intlayer";
import { useI18nHTMLAttributes } from "./hooks/intlayer/usei18nHTMLAttributes";
import Header from "./layout/Header/Header";
import Footer from "./layout/Footer/Footer";
import { PageTitleBoard } from "./components/layout/PageTitleBoard";
import ScrollToTop from "./components/layout/ScrollToTop/ScrollToTop";

export async function loader({ request }: Route.LoaderArgs) {
  const locale = getLocaleFromPath(request.url);

  if (!locale) {
    throw data("Language not supported", { status: 404 });
  }

  return { locale };
}


export function Layout({
  children,
}: { children: React.ReactNode } & Route.ComponentProps) {
  const data = useLoaderData<typeof loader>();
  const { pathname } = useLocation();

  // The root loader only re-runs on a document request, so its locale goes stale
  // on client-side navigation between locales. Derive it from the current path
  // instead, falling back to the loader value for the initial server render.
  const locale = getLocaleFromPath(pathname) ?? data?.locale;

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        <IntlayerProvider 
          locale={locale}>
            <Header />
            {children}
            <Footer />
            <ScrollToTop />
          </IntlayerProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useI18nHTMLAttributes();
  return (
    <>
      <PageTitleBoard />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oopsie!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

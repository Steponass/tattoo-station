import { createContext, type RouterContextProvider } from "react-router";

export type CloudflareBindings = {
  env: Env;
  ctx: ExecutionContext;
};

export const cloudflareContext = createContext<CloudflareBindings>();

export function getCloudflareBindings(
  context: Readonly<RouterContextProvider>,
): CloudflareBindings {
  return context.get(cloudflareContext);
}

export function getDatabase(
  context: Readonly<RouterContextProvider>,
): D1Database {
  return context.get(cloudflareContext).env.DB;
}
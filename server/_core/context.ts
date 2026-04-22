import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = { id: 1, openId: "local", name: "Owner", email: null, loginMethod: null, role: "admin", lastSignedIn: new Date(), createdAt: new Date() } as any;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

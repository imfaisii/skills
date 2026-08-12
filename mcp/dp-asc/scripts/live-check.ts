#!/usr/bin/env bun
/**
 * Optional live check against App Store Connect.
 * Requires ASC_ISSUER_ID, ASC_KEY_ID, and ASC_PRIVATE_KEY_PATH or ASC_PRIVATE_KEY.
 *
 *   ASC_ISSUER_ID=… ASC_KEY_ID=… ASC_PRIVATE_KEY_PATH=…/AuthKey_….p8 bun run scripts/live-check.ts
 */
import { ascRequest } from "../src/client.ts";

const res = await ascRequest({
  method: "GET",
  path: "/v1/apps",
  query: { limit: 5 },
});
console.log("status", res.status);
if (res.status >= 400) {
  console.log(JSON.stringify(res.body, null, 2).slice(0, 800));
  process.exit(1);
}
const data =
  (
    res.body as {
      data?: Array<{
        id: string;
        attributes?: { name?: string; bundleId?: string };
      }>;
    }
  )?.data || [];
console.log(
  "apps",
  data.map((a) => ({
    id: a.id,
    name: a.attributes?.name,
    bundleId: a.attributes?.bundleId,
  })),
);
console.log("LIVE_OK");

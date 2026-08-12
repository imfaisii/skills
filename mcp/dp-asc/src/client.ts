import {
  createAscToken,
  loadCredentialsFromEnv,
  type AscCredentials,
} from "./auth.js";

export const ASC_BASE_URL =
  process.env.ASC_BASE_URL || "https://api.appstoreconnect.apple.com";

export type AscRequestOptions = {
  method: string;
  path: string;
  /** Path template params, e.g. { id: "..." } */
  pathParams?: Record<string, string>;
  /** Query string values; arrays join with comma (ASC form explode:false) */
  query?: Record<string, unknown>;
  /** JSON body object, or raw string/Buffer */
  body?: unknown;
  /** Override Accept (reports use application/a-gzip) */
  accept?: string;
  /** Extra headers */
  headers?: Record<string, string>;
  credentials?: AscCredentials;
};

export type AscResponse = {
  status: number;
  headers: Record<string, string>;
  /** Parsed JSON when content-type is json; otherwise text or base64 note */
  body: unknown;
  contentType: string | null;
};

function fillPath(path: string, params?: Record<string, string>): string {
  if (!params) return path;
  return path.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const v = params[name];
    if (v === undefined || v === null || v === "") {
      throw new Error(`Missing path parameter: ${name}`);
    }
    return encodeURIComponent(String(v));
  });
}

function buildQuery(query?: Record<string, unknown>): string {
  if (!query) return "";
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      // ASC OpenAPI uses style:form explode:false → comma-separated
      sp.set(key, value.map(String).join(","));
    } else if (typeof value === "object") {
      sp.set(key, JSON.stringify(value));
    } else {
      sp.set(key, String(value));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function ascRequest(
  opts: AscRequestOptions,
): Promise<AscResponse> {
  const creds = opts.credentials ?? loadCredentialsFromEnv();
  const { token } = await createAscToken(creds);

  const path = fillPath(opts.path, opts.pathParams);
  const url = `${ASC_BASE_URL.replace(/\/$/, "")}${path}${buildQuery(opts.query)}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: opts.accept || "application/json",
    ...opts.headers,
  };

  let bodyInit: BodyInit | undefined;
  if (opts.body !== undefined && opts.body !== null) {
    if (
      typeof opts.body === "string" ||
      opts.body instanceof Uint8Array ||
      opts.body instanceof ArrayBuffer
    ) {
      bodyInit = opts.body as BodyInit;
    } else {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      bodyInit = JSON.stringify(opts.body);
    }
  }

  const res = await fetch(url, {
    method: opts.method.toUpperCase(),
    headers,
    body: bodyInit,
  });

  const contentType = res.headers.get("content-type");
  const outHeaders: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    outHeaders[k] = v;
  });

  const buf = Buffer.from(await res.arrayBuffer());
  let body: unknown;

  if (buf.length === 0) {
    body = null;
  } else if (contentType?.includes("application/json")) {
    const text = buf.toString("utf8");
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  } else if (
    contentType?.includes("text/") ||
    contentType?.includes("csv") ||
    contentType?.includes("xml")
  ) {
    body = buf.toString("utf8");
  } else if (
    contentType?.includes("gzip") ||
    contentType?.includes("a-gzip") ||
    contentType?.includes("octet-stream")
  ) {
    body = {
      encoding: "base64",
      contentType,
      byteLength: buf.length,
      data: buf.toString("base64"),
      note: "Binary download (e.g. finance/sales report). Decode base64 to recover the file.",
    };
  } else {
    // best-effort
    const asText = buf.toString("utf8");
    if (/^[\x09\x0a\x0d\x20-\x7e]*$/.test(asText)) {
      body = asText;
    } else {
      body = {
        encoding: "base64",
        contentType,
        byteLength: buf.length,
        data: buf.toString("base64"),
      };
    }
  }

  return {
    status: res.status,
    headers: outHeaders,
    body,
    contentType,
  };
}

/** Format a response for MCP tool output (truncate huge payloads). */
export function formatToolResult(
  res: AscResponse,
  maxChars = 120_000,
): { text: string; isError: boolean } {
  const isError = res.status >= 400;
  const payload = {
    status: res.status,
    contentType: res.contentType,
    body: res.body,
  };
  let text = JSON.stringify(payload, null, 2);
  if (text.length > maxChars) {
    text =
      text.slice(0, maxChars) +
      `\n… truncated (${text.length} chars total). Narrow filters/fields or raise limit.`;
  }
  return { text, isError };
}

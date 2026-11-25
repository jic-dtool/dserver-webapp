// dtoolCommand.ts
//
// dserver:// URIs and commands for the dtool command line (dtool-dserver).
//
// They name the address of this web interface, as users see it in the
// browser: `dtool dserver login <address>` finds the dserver API from the
// <meta name="dserver-url"> of public/index.html, and dserver://<host>/...
// URIs then go to that API.

/**
 * The address of this web interface, e.g. "https://dtool.example.org" or,
 * when deployed under a path, "https://example.org/dtool".
 */
export function webAddress(
  origin: string = window.location.origin,
  basePath: string = process.env.BASE_URL || "/",
): string {
  return new URL(basePath, origin).href.replace(/\/$/, "");
}

/**
 * Convert a storage URI ("s3://bucket" or "s3://bucket/<uuid>") to a
 * dserver URI ("dserver://<host>/s3/bucket[/<uuid>]").
 *
 * Returns null for URIs without a bucket or container (e.g. file://...),
 * which dserver URIs cannot express.
 */
export function dserverUri(
  uri: string,
  host: string = window.location.host,
): string | null {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/]+)(\/[^/]+)?\/?$/i.exec(uri);
  if (!match) return null;
  const [, scheme, bucket, uuid] = match;
  return `dserver://${host}/${scheme}/${bucket}${uuid ?? ""}`;
}

/** The command to log in to this dserver from the command line. */
export function loginCommand(address: string = webAddress()): string {
  return `dtool dserver login ${address}`;
}

// Vercel prefixes the variables when a Blob store is recreated or a second one
// is added (BLOB_, BLOB2_, ...). The @vercel/blob SDK only auto-reads the
// unprefixed BLOB_READ_WRITE_TOKEN, so the token is resolved here and passed
// explicitly to every call.
export const BLOB_TOKEN_VARS = ["BLOB_READ_WRITE_TOKEN", "BLOB2_READ_WRITE_TOKEN"] as const;

export function getBlobToken() {
  for (const name of BLOB_TOKEN_VARS) {
    const value = process.env[name];
    if (value) return { name, value };
  }
  // Accept any other prefix so a differently named store still works.
  for (const [name, value] of Object.entries(process.env)) {
    if (name.endsWith("_READ_WRITE_TOKEN") && value) return { name, value };
  }
  return null;
}

export function requireBlobToken() {
  const found = getBlobToken();
  if (!found) {
    throw new Error(`No Blob token set. Expected one of: ${BLOB_TOKEN_VARS.join(", ")}`);
  }
  return found.value;
}

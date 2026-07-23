/**
 * Hex SHA-256 of a JSON-serializable value. Used for change detection
 * (container-set diffing) and per-container fingerprints.
 * @param {*} object
 * @returns {Promise<string>} 64-char hex digest
 */
export async function sha256(object) {
  const json = JSON.stringify(object);
  const data = new TextEncoder().encode(json);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return [...new Uint8Array(hashBuffer)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

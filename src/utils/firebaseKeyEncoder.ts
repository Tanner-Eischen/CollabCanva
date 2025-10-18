/**
 * Firebase Key Encoder
 * 
 * Firebase Realtime Database doesn't allow certain characters in object keys:
 * ".", "#", "$", "/", "[", "]"
 * 
 * This utility encodes/decodes keys to make them Firebase-safe.
 * 
 * IMPORTANT: Only use on NESTED metadata objects, not on root Asset properties!
 */

// Characters that Firebase doesn't allow in keys
const INVALID_CHARS = ['.', '#', '$', '/', '[', ']'] as const

// Encoding map: character -> safe replacement
const ENCODE_MAP: Record<string, string> = {
  '.': '__DOT__',
  '#': '__HASH__',
  '$': '__DOLLAR__',
  '/': '__SLASH__',
  '[': '__LBRACKET__',
  ']': '__RBRACKET__',
}

// Decoding map: safe replacement -> character
const DECODE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ENCODE_MAP).map(([char, encoded]) => [encoded, char])
)

/**
 * Encode a single key to be Firebase-safe
 */
export function encodeFirebaseKey(key: string): string {
  let encoded = key
  for (const [char, replacement] of Object.entries(ENCODE_MAP)) {
    encoded = encoded.replaceAll(char, replacement)
  }
  return encoded
}

/**
 * Decode a Firebase-safe key back to its original form
 */
export function decodeFirebaseKey(key: string): string {
  let decoded = key
  for (const [replacement, char] of Object.entries(DECODE_MAP)) {
    decoded = decoded.replaceAll(replacement, char)
  }
  return decoded
}

/**
 * Encode all keys in an object to be Firebase-safe
 * USE ONLY on metadata objects like namedTiles, tileGroups, NOT on root Asset!
 */
export function encodeFirebaseKeys<T>(obj: Record<string, T> | undefined): Record<string, T> | undefined {
  if (!obj) return obj
  const encoded: Record<string, T> = {}
  for (const [key, value] of Object.entries(obj)) {
    encoded[encodeFirebaseKey(key)] = value
  }
  return encoded
}

/**
 * Decode all keys in an object back to their original form
 * USE ONLY on metadata objects like namedTiles, tileGroups, NOT on root Asset!
 */
export function decodeFirebaseKeys<T>(obj: Record<string, T> | undefined): Record<string, T> | undefined {
  if (!obj) return obj
  const decoded: Record<string, T> = {}
  for (const [key, value] of Object.entries(obj)) {
    decoded[decodeFirebaseKey(key)] = value
  }
  return decoded
}

/**
 * Remove undefined values from an object recursively
 * Firebase doesn't allow undefined values
 */
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues)
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value)
      }
    }
    return cleaned
  }
  
  return obj
}

/**
 * Encode Asset for Firebase - only encodes metadata keys, not root properties
 */
export function encodeAssetForFirebase(asset: any): any {
  const encoded = { ...asset }
  
  // Encode tileset metadata keys
  if (encoded.tilesetMetadata) {
    if (encoded.tilesetMetadata.namedTiles) {
      encoded.tilesetMetadata = {
        ...encoded.tilesetMetadata,
        namedTiles: encodeFirebaseKeys(encoded.tilesetMetadata.namedTiles)
      }
    }
    if (encoded.tilesetMetadata.tileGroups) {
      const encodedGroups: any = {}
      for (const [groupKey, groupValue] of Object.entries(encoded.tilesetMetadata.tileGroups)) {
        const encodedGroup = { ...groupValue as any }
        if (encodedGroup.tiles) {
          encodedGroup.tiles = encodeFirebaseKeys(encodedGroup.tiles)
        }
        // Remove undefined values from the group
        encodedGroups[encodeFirebaseKey(groupKey)] = removeUndefinedValues(encodedGroup)
      }
      encoded.tilesetMetadata = {
        ...encoded.tilesetMetadata,
        tileGroups: encodedGroups
      }
    }
  }
  
  // Remove all undefined values from the entire asset
  return removeUndefinedValues(encoded)
}

/**
 * Decode Asset from Firebase - only decodes metadata keys, not root properties
 */
export function decodeAssetFromFirebase(asset: any): any {
  if (!asset) return asset
  
  const decoded = { ...asset }
  
  // Decode tileset metadata keys
  if (decoded.tilesetMetadata) {
    if (decoded.tilesetMetadata.namedTiles) {
      decoded.tilesetMetadata = {
        ...decoded.tilesetMetadata,
        namedTiles: decodeFirebaseKeys(decoded.tilesetMetadata.namedTiles)
      }
    }
    if (decoded.tilesetMetadata.tileGroups) {
      const decodedGroups: any = {}
      for (const [groupKey, groupValue] of Object.entries(decoded.tilesetMetadata.tileGroups)) {
        const decodedGroup = { ...groupValue as any }
        if (decodedGroup.tiles) {
          decodedGroup.tiles = decodeFirebaseKeys(decodedGroup.tiles)
        }
        decodedGroups[decodeFirebaseKey(groupKey)] = decodedGroup
      }
      decoded.tilesetMetadata = {
        ...decoded.tilesetMetadata,
        tileGroups: decodedGroups
      }
    }
  }
  
  return decoded
}

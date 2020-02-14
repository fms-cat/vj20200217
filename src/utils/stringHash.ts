// https://developer.mozilla.org/ja/docs/Web/API/SubtleCrypto/digest

export async function stringHash( value: string ): Promise<string> {
  const encoded = new TextEncoder().encode( value );
  const hashBuffer = await crypto.subtle.digest( 'SHA-256', encoded );
  const hashArray = Array.from( new Uint8Array( hashBuffer ) );
  const hashHex = hashArray.map( ( b ) => b.toString( 16 ).padStart( 2, '0' ) ).join( '' );
  return hashHex;
}

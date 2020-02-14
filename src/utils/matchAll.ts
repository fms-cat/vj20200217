export function matchAll( str: string, regex: RegExp ): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  let match = regex.exec( str );
  while ( match ) {
    matches.push( match );
    match = regex.exec( str );
  }
  return matches;
}

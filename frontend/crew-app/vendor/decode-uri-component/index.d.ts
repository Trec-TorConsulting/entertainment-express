/**
Decodes a Uniform Resource Identifier (URI) component previously created by `encodeURIComponent()`
or by a similar routine.

@param encodedURI - An encoded component of a URI.

@returns The decoded URI component.
*/
declare function decodeUriComponent(encodedURI: string): string;
export = decodeUriComponent;

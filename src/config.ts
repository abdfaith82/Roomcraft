/**
 * Optional styling backend. Must return { tips: string[], styles: StylePick[] }.
 * Leave undefined to use the built-in offline suggestions.
 * Never put a model API key in the app; call your own server that holds it.
 */
export const STYLE_ENDPOINT: string | undefined = undefined;

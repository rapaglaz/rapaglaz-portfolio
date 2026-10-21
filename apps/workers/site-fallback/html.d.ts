// Wrangler bundles an imported .html file as a text module
declare module '*.html' {
  const content: string;
  export default content;
}

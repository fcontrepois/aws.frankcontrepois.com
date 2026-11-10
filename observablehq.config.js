// See https://observablehq.com/framework/config for documentation.
import {instanceComparisonServices} from "./lib/instance-comparisons/registry.js";

export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "AWS pricing in graphs",

  // The pages and sections in the sidebar. If you don’t specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  pages: [
    {name: "Explore AWS pricing", path: "/"},
    {name: "Regions & pricing", path: "/regions"},
    {name: "Instance comparisons", pages: [
      {name: "Overview", path: "/comparisons/"},
      ...instanceComparisonServices.map((service) => ({name: service.shortName, path: `/comparisons/${service.id}/`}))
    ]},
    {name: "FX exposure", path: "/fx-exposure"},
    {name: "S3 price history", path: "/s3PriceHistory"}
  ],

  dynamicPaths: async function* () {
    for (const service of instanceComparisonServices) {
      const {rows} = await service.readCatalogText();
      const families = [...new Set(rows.map((d) => d.family).filter(Boolean))].sort();
      yield `/comparisons/${service.id}/`;
      for (const family of families) yield `/comparisons/${service.id}/${family}`;
    }
  },

  // Content to add to the head of the page, e.g. for a favicon:
  head: `
    <link rel="icon" href="/assets/frank-glasses-logo.png" type="image/png">
    <link rel="stylesheet" href="/assets/identity.css">
    <!-- Fathom - beautiful, simple website analytics -->
    <script src="https://cdn.usefathom.com/script.js" data-site="PEWAUCOW" defer></script>
    <!-- / Fathom -->
  `,

  // The path to the source root.
  root: "src",

  // Some additional configuration options and their defaults:
  theme: ["near-midnight"],
  header:`
  <div class="aws-identity">
    <a class="aws-brand" href="https://frankcontrepois.com/"><img src="/assets/frank-glasses-logo.png" width="48" height="48" alt=""><span>AWS pricing research by<strong>Frank Contrepois</strong></span></a>
    <nav class="aws-links" aria-label="Frank’s work"><a href="https://frankcontrepois.com/">Writing &amp; ideas</a><a href="https://coblan.it/">Work with Frank</a></nav>
  </div>
  <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-6YD6LFWQFG"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-6YD6LFWQFG');
</script>
  `,
   footer: '<div class="aws-footer"><span>AWS pricing research · Frank Contrepois</span><a href="https://frankcontrepois.com/">Context is everything</a><span>Built with Observable.</span></div>', // what to show in the footer (HTML)
  // sidebar: true, // whether to show the sidebar
   toc: true, // whether to show the table of contents
  // pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  typographer: true, // smart quotes and other typographic improvements
  // cleanUrls: true, // drop .html from URLs
};

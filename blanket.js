require('blanket')({
  // Only files that match the pattern will be instrumented
  pattern: '/lib/',
  "data-cover-never": "node_modules"
});

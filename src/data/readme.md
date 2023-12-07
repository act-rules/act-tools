# Data

These data files are maintained by hand.

The technique-titles.json file can be updated by running the following code in the console on the [techniques page](https://www.w3.org/WAI/WCAG22/Techniques/).

```js
JSON.stringify(Object.fromEntries($$('.toc-wcag-docs a').map(a => {
  return a.textContent.split(': ').map(t => t.replaceAll(/\s+/g, ' '))
})), null, 2)
```

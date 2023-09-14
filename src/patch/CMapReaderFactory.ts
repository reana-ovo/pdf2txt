/** @type {import('pdfjs-dist/types/src/shared/util')} */
import pdfjs from 'pdfjs-dist';

// see https://github.com/mozilla/pdf.js/blob/628e70fbb5dea3b9066aa5c34cca70aaafef8db2/src/display/dom_utils.js#L64
``;
export default function () {
  this.fetch = async function (query) {
    const bcmap = await import(
      './buffer-loader!pdfjs-dist/cmaps/' +
        query.name +
        '.bcmap' /* webpackChunkName: "noprefetch-[request]" */
    );
    delete require.cache[
      require.resolve('./buffer-loader!pdfjs-dist/cmaps/' + query.name + '.bcmap')
    ];
    return {
      cMapData: bcmap.default,
      compressionType: pdfjs.CMapCompressionType.BINARY,
    };
  };
}

/* ============================================================
   SOCCER CAGE — Lector mínimo de hojas de cálculo (.xlsx y .csv)

   Un .xlsx es un zip con XML adentro. Se lee el índice del zip,
   se descomprime con DecompressionStream (nativo del navegador)
   y se toma la primera hoja como filas de texto. Sin librerías.
   ============================================================ */

const XlsxLite = {
  /** Devuelve las filas de la primera hoja: [[celda, celda, …], …]. */
  async readFile(file) {
    if (/\.xlsx$/i.test(file.name)) return this.readXlsx(new Uint8Array(await file.arrayBuffer()));
    return this.readCsv(await file.text());
  },

  readCsv(text) {
    const lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) return [];
    // El separador se decide con el encabezado: Excel en español guarda con ";".
    const h = lines[0];
    const count = ch => h.split(ch).length - 1;
    const sep = count('\t') ? '\t' : (count(';') > count(',') ? ';' : ',');
    return lines.map(l => Store.parseCsvLine(l, sep));
  },

  async readXlsx(buf) {
    const files = await this.unzip(buf, n =>
      n === 'xl/workbook.xml' || n === 'xl/_rels/workbook.xml.rels' ||
      n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));

    const xml = s => new DOMParser().parseFromString(s, 'application/xml');
    const all = (doc, tag) => Array.from(doc.getElementsByTagNameNS('*', tag));

    // Textos compartidos: Excel guarda cada texto una vez y la celda apunta a su índice.
    const shared = files['xl/sharedStrings.xml']
      ? all(xml(files['xl/sharedStrings.xml']), 'si').map(si => all(si, 't').map(t => t.textContent).join(''))
      : [];

    // Primera hoja según el libro (no siempre se llama sheet1.xml).
    let sheetPath = null;
    if (files['xl/workbook.xml'] && files['xl/_rels/workbook.xml.rels']) {
      const first = all(xml(files['xl/workbook.xml']), 'sheet')[0];
      const rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
      const rel = all(xml(files['xl/_rels/workbook.xml.rels']), 'Relationship').find(r => r.getAttribute('Id') === rid);
      if (rel) sheetPath = 'xl/' + rel.getAttribute('Target').replace(/^\/?xl\//, '').replace(/^\//, '');
    }
    if (!sheetPath || !files[sheetPath]) {
      sheetPath = Object.keys(files).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
        .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]))[0];
    }
    if (!sheetPath) throw new Error('no-sheet');

    const colIndex = ref => {
      const letters = (ref.match(/^[A-Z]+/) || ['A'])[0];
      let n = 0;
      for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
      return n - 1;
    };

    const rows = [];
    all(xml(files[sheetPath]), 'row').forEach(r => {
      const out = [];
      all(r, 'c').forEach((c, i) => {
        const idx = c.getAttribute('r') ? colIndex(c.getAttribute('r')) : i;
        const t = c.getAttribute('t');
        const v = all(c, 'v')[0];
        let val = '';
        if (t === 's') val = shared[parseInt(v ? v.textContent : '-1')] || '';
        else if (t === 'inlineStr') val = all(c, 't').map(x => x.textContent).join('');
        else if (t === 'b') val = v && v.textContent === '1' ? 'TRUE' : 'FALSE';
        else val = v ? v.textContent : '';
        out[idx] = String(val).trim();
      });
      for (let k = 0; k < out.length; k++) if (out[k] === undefined) out[k] = '';
      if (out.some(x => x)) rows.push(out);
    });
    return rows;
  },

  /** Extrae del zip solo los archivos que pide `want(nombre)`, como texto. */
  async unzip(buf, want) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let eocd = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('not-zip');

    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const dec = new TextDecoder();
    const out = {};
    for (let k = 0; k < count; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('bad-zip');
      const method = dv.getUint16(p + 10, true);
      const csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen));
      p += 46 + nlen + xlen + clen;
      if (!want(name)) continue;

      const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
      const data = buf.subarray(start, start + csize);
      if (method === 0) out[name] = dec.decode(data);
      else if (method === 8) {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        out[name] = await new Response(stream).text();
      }
    }
    return out;
  }
};

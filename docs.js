/* Reads uploaded files in the browser and finds the passage that best matches a question.
   PDF uses pdf.js, DOCX uses mammoth (both loaded from cdnjs in index.html), TXT/MD are read directly.
   This is keyword search, not an AI model. For real AI answers, send the question and the
   best passages to your backend / LLM (see the comment in reply() in script.js). */
const Docs = (() => {
  let docs = []; // [{ name, chunks: [{ page, text }] }]
  const key = email => "sa_docs:" + email;

  function load(email) {
    try { docs = JSON.parse(localStorage.getItem(key(email)) || "[]"); } catch (e) { docs = []; }
    return docs;
  }

  function save(email) {
    try { localStorage.setItem(key(email), JSON.stringify(docs)); return true; } catch (e) { return false; }
  }

  async function extract(file) {
    const n = file.name.toLowerCase();
    if (/\.(txt|md)$/.test(n)) return [{ page: 1, text: await file.text() }];

    if (n.endsWith(".pdf")) {
      if (!window.pdfjsLib) throw new Error("The PDF reader could not load. Check your internet connection and refresh.");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const content = await (await pdf.getPage(i)).getTextContent();
        pages.push({ page: i, text: content.items.map(x => x.str).join(" ") });
      }
      return pages;
    }

    if (n.endsWith(".docx")) {
      if (!window.mammoth) throw new Error("The Word reader could not load. Check your internet connection and refresh.");
      const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return [{ page: 1, text: r.value }];
    }

    throw new Error("Unsupported file. Choose a PDF, DOCX, TXT, or MD file.");
  }

  // Split page text into pieces of roughly 600 characters, breaking at sentence ends.
  function chunk(pages) {
    const out = [];
    pages.forEach(p => {
      const sentences = p.text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]*/g) || [];
      let cur = "";
      sentences.forEach(s => {
        if ((cur + s).length > 600 && cur) { out.push({ page: p.page, text: cur.trim() }); cur = ""; }
        cur += s + " ";
      });
      if (cur.trim()) out.push({ page: p.page, text: cur.trim() });
    });
    return out;
  }

  async function add(file, email) {
    const pages = await extract(file);
    const chunks = chunk(pages);
    if (!chunks.length) throw new Error("No readable text found. The file may be a scanned image. Try a text-based PDF.");
    docs = docs.filter(d => d.name !== file.name);
    docs.push({ name: file.name, pages: pages.length, chunks });
    return { pages: pages.length, saved: save(email) };
  }

  function remove(i, email) { docs.splice(i, 1); save(email); }

  const STOP = new Set("the and for are what how why does did can you with this that from have has was were which when where who whom into about explain tell give describe define meaning mean please only each other some more two three one also than then there their them they its not but all any can will would should could may might must".split(" "));
  const words = s => (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !STOP.has(w));

  // Returns { text, doc, page } for the best matching passage, or null.
  function search(q) {
    const qw = [...new Set(words(q))];
    if (!qw.length || !docs.length) return null;
    const all = [];
    docs.forEach(d => d.chunks.forEach(c => all.push({ doc: d.name, page: c.page, text: c.text, set: new Set(words(c.text)) })));
    const df = w => all.filter(c => c.set.has(w)).length;
    let best = null, bestScore = 0;
    all.forEach(c => {
      let s = 0;
      qw.forEach(w => { if (c.set.has(w)) s += 1 + Math.log(1 + all.length / df(w)); });
      if (s > bestScore) { bestScore = s; best = c; }
    });
    if (!best || bestScore < 1.5) return null;

    // Trim the passage to the sentences that match the question most.
    const sents = best.text.match(/[^.!?]+[.!?]*/g) || [best.text];
    let bi = 0, bs = -1;
    sents.forEach((s, i) => { const sc = words(s).filter(w => qw.includes(w)).length; if (sc > bs) { bs = sc; bi = i; } });
    const text = (sents[bi] + (sents[bi + 1] || "")).trim();
    return { text, doc: best.doc, page: best.page };
  }

  // Builds a study guide from one document: summary, key terms, definitions and practice questions.
  // It picks the most important sentences from your own text (no AI model, no internet needed).
  function guide(name) {
    const d = docs.find(x => x.name === name);
    if (!d) return null;
    const sents = [];
    d.chunks.forEach(c => (c.text.match(/[^.!?]+[.!?]*/g) || []).forEach(t => {
      t = t.trim();
      if (t.length >= 40 && t.length <= 320) sents.push({ text: t, page: c.page });
    }));
    if (sents.length < 3) return null;

    const freq = {};
    sents.forEach(s => words(s.text).forEach(w => { freq[w] = (freq[w] || 0) + 1; }));
    const score = s => { const w = words(s.text); return w.length ? w.reduce((a, x) => a + freq[x], 0) / Math.sqrt(w.length) : 0; };

    const summary = sents.map((s, i) => ({ text: s.text, page: s.page, i, sc: score(s) }))
      .sort((a, b) => b.sc - a.sc).slice(0, 8).sort((a, b) => a.i - b.i);
    const terms = Object.entries(freq).filter(([w, n]) => n >= 2 && w.length > 3)
      .sort((a, b) => b[1] - a[1]).slice(0, 12).map(([w]) => w);

    const defs = [];
    const re = /^([A-Z][A-Za-z0-9\- ]{2,40}?)\s+(is|are|refers to|means|is defined as|can be defined as)\s+(.{15,})$/;
    sents.forEach(s => {
      const m = s.text.match(re);
      if (m && defs.length < 8 && !defs.some(x => x.term.toLowerCase() === m[1].trim().toLowerCase()))
        defs.push({ term: m[1].trim().replace(/^(a|an|the)\s+/i, ""), text: s.text, page: s.page });
    });

    const questions = defs.map(x => ({ q: "What is " + x.term + "?", a: x.text }));
    summary.forEach(s => {
      if (questions.length >= 10) return;
      const w = words(s.text).find(x => terms.includes(x));
      if (!w) return;
      const blank = s.text.replace(new RegExp("\\b" + w + "\\b", "i"), "_____");
      if (blank !== s.text) questions.push({ q: "Fill in the blank: " + blank, a: w });
    });
    return { name: d.name, pages: d.pages || 1, summary, terms, defs, questions };
  }

  return { load, add, remove, search, guide, list: () => docs, count: () => docs.length };
})();
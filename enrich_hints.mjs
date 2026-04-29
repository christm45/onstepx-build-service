// Enrich configurator field hints with upstream Config.h inline comments.
// Reads upstream Config.h files, builds FIELD_NAME -> comment map,
// then appends a <span class="config-comment">// ...</span> sibling next
// to every existing <span class="field-hint">...</span> in index.html.
//
// Source-of-truth for upstream:
//   OnStepX:        OnStepX/Config.h + Extended.config.h
//   SWS:            /tmp/sws_ref/Config.h + Extended.config.h
//   SHC:            /tmp/sws_ref/SHC_Config.h + SHC_Extended.config.h
//
// Field IDs in index.html may carry a SHC_ or SWS_ prefix; we strip it
// before lookup. SHC and SWS take precedence over OnStepX for prefixed IDs;
// OnStepX is the fallback.

import { readFileSync, writeFileSync } from 'node:fs';

const ONSTEP_FILES = [
  'C:/Users/Bogdan/Desktop/OnStepX-github configurator/OnStepX/Config.h',
  'C:/Users/Bogdan/Desktop/OnStepX-github configurator/OnStepX/Extended.config.h',
];
const SWS_FILES = [
  'C:/Users/Bogdan/AppData/Local/Temp/sws_ref/Config.h',
  'C:/Users/Bogdan/AppData/Local/Temp/sws_ref/Extended.config.h',
];
const SHC_FILES = [
  'C:/Users/Bogdan/AppData/Local/Temp/sws_ref/SHC_Config.h',
  'C:/Users/Bogdan/AppData/Local/Temp/sws_ref/SHC_Extended.config.h',
];
const HTML_PATH = 'C:/Users/Bogdan/Desktop/OnStepX-github configurator/index.html';

// Tags the configurator already shows as a hint-tag badge — strip from the
// upstream comment to avoid duplication.
const TRAILING_TAGS = /\s+(?:<-)?(?:Often|Adjust|Option|Infreq|Req'd|Reqd)\.?$/i;

function parseConfigH(text) {
  const map = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(/^#define\s+(\w+)\s+\S+\s*\/\/\s*(.+?)\s*$/);
    if (!m) continue;
    const name = m[1];
    let comment = m[2];
    // Drop the leading "default-value-restated, " bit (e.g. "OFF, ", "9600, ", "n. ")
    // — we want the descriptive text, not the value restatement.
    // Handle three forms:
    //   1. Brace-enclosed value:  "{192,168,0,1}, Wifi Access Point IP."
    //   2. Hex array:             "{0xDE,0xAD,...}, MAC address."
    //   3. Bare token:            "OFF, " / "9600, " / "n. "
    if (/^\{[^}]*\}\s*,\s*/.test(comment)) {
      // Brace-enclosed value: "{192,168,0,1}, descr"
      comment = comment.replace(/^\{[^}]*\}\s*,\s*/, '');
    } else if (/^\.\.[^}]*\}\s*,\s*/.test(comment)) {
      // Truncated brace value SmartWebServer style: "..,168,0,1}, descr"
      comment = comment.replace(/^\.\.[^}]*\}\s*,\s*/, '');
    } else {
      // Bare token: "OFF, " / "9600, " / "n. "
      comment = comment.replace(/^[^,]+,\s*/, '');
    }
    // Drop trailing difficulty tag (Often, Adjust, etc.)
    comment = comment.replace(TRAILING_TAGS, '');
    // Collapse internal whitespace
    comment = comment.replace(/\s{2,}/g, ' ').trim();
    if (comment) map.set(name, comment);
  }
  return map;
}

function loadAll(paths) {
  const merged = new Map();
  for (const p of paths) {
    try {
      const text = readFileSync(p, 'utf8');
      for (const [k, v] of parseConfigH(text)) merged.set(k, v);
    } catch (e) {
      console.warn(`! could not read ${p}: ${e.message}`);
    }
  }
  return merged;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function main() {
  const onstepx = loadAll(ONSTEP_FILES);
  const sws = loadAll(SWS_FILES);
  const shc = loadAll(SHC_FILES);
  console.log(`loaded: OnStepX=${onstepx.size}, SWS=${sws.size}, SHC=${shc.size}`);

  let html = readFileSync(HTML_PATH, 'utf8');
  let appended = 0;
  let skippedAlreadyEnriched = 0;
  let skippedNoMatch = 0;
  const unmatchedIds = new Set();

  // Match a field-row up to and including its <span class="field-hint">...</span>.
  // We capture the form-element id so we can look up the upstream comment.
  // Then we insert a new sibling <span class="config-comment">...</span> after it.
  //
  // Pattern targets:
  //   id="FOO" ... <span class="field-hint">existing</span>
  // and replaces with:
  //   id="FOO" ... <span class="field-hint">existing</span><span class="config-comment">// upstream</span>
  //
  // We require the form element id and the field-hint to be in the same
  // ~10 lines (one field-row block). Cross-field collisions are avoided by
  // anchoring on the FIRST id="..." we see in each row.
  const ROW_RE = /(<div class="field-row">[\s\S]*?<span class="field-hint">[\s\S]*?<\/span>)/g;
  html = html.replace(ROW_RE, (rowBlock) => {
    // Skip if already has config-comment
    if (rowBlock.includes('class="config-comment"')) {
      skippedAlreadyEnriched++;
      return rowBlock;
    }
    // Find the first id="..." inside this row (the form element)
    const idMatch = rowBlock.match(/\sid="([A-Z][A-Za-z0-9_]*)"/);
    if (!idMatch) {
      skippedNoMatch++;
      return rowBlock;
    }
    const fullId = idMatch[1];
    // Strip mode prefix: SHC_FOO -> FOO, SWS_FOO -> FOO
    let bareName = fullId;
    let lookup = onstepx;
    if (fullId.startsWith('SHC_')) {
      bareName = fullId.slice(4);
      lookup = shc;
    } else if (fullId.startsWith('SWS_')) {
      bareName = fullId.slice(4);
      lookup = sws;
    }
    // Try the prefix-specific map first, then OnStepX as fallback
    let comment = lookup.get(bareName);
    if (!comment && lookup !== onstepx) comment = onstepx.get(bareName);
    if (!comment) {
      unmatchedIds.add(fullId);
      return rowBlock;
    }
    // Append the new sibling. Use a leading space to keep grid layout calm.
    const inject = `<span class="config-comment">// ${escapeHtml(comment)}</span>`;
    appended++;
    return rowBlock.replace(/(<span class="field-hint">[\s\S]*?<\/span>)/, `$1${inject}`);
  });

  writeFileSync(HTML_PATH, html);
  console.log(`appended:           ${appended}`);
  console.log(`skipped (already):  ${skippedAlreadyEnriched}`);
  console.log(`skipped (no id):    ${skippedNoMatch}`);
  console.log(`unmatched IDs (no upstream comment):`);
  for (const id of [...unmatchedIds].sort()) console.log(`  ${id}`);
}

main();

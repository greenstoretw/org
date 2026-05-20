var RAG = (function () {

  var CHUNK_MAX = 800;

  function stripHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.innerHTML = str;
    return (div.textContent || div.innerText || '').trim();
  }

  function norm(str) {
    return str.replace(/[\r\n]+/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n /g, '\n').trim();
  }

  function clean(val) {
    if (!val) return '';
    if (typeof val === 'object') {
      return clean(val['zh-TW'] || val['en'] || val[Object.keys(val)[0]]);
    }
    return norm(stripHtml(String(val)));
  }

  function cleanDoc(raw) {
    if (!raw || raw.status !== 'active') return null;
    return {
      id:       raw.id,
      name:     clean(raw.name),
      type:     clean(raw.type),
      address:  clean(raw.address),
      desc:     clean(raw.description),
      phone:    raw.phone || '',
      website:  raw.website || '',
      hours:    raw.openingHours || '',
      eco:      Array.isArray(raw.ecoFeatures) ? raw.ecoFeatures.map(function(f){return f.trim()}).filter(Boolean) : [],
      lat:      raw.location ? raw.location.latitude : null,
      lng:      raw.location ? raw.location.longitude : null,
      verified: !!raw.verified,
      partner:  !!raw.isPartner,
      featured: !!raw.featured,
      isBranch: !!raw.isBranch,
      parentId: raw.parentId || null
    };
  }

  function chunkShop(shop, all) {
    if (!shop) return [];
    var out = [];

    var id = shop.name;
    if (shop.type)     id += ' (' + shop.type + ')';
    if (shop.verified) id += ' [官方認證]';
    if (shop.partner)  id += ' [合作店家]';
    id += '\n';
    if (shop.address) id += '地址: ' + shop.address + '\n';
    if (shop.phone)   id += '電話: ' + shop.phone + '\n';
    if (shop.website) id += '網站: ' + shop.website + '\n';
    if (shop.hours)   id += '營業: ' + shop.hours + '\n';
    if (shop.lat)     id += '座標: ' + shop.lat + ', ' + shop.lng + '\n';
    if (shop.desc)    id += shop.desc;
    out.push({ shopId: shop.id, type: 'identity', text: norm(id) });

    if (shop.eco.length) {
      var eco = shop.name + ' 永續特點: ' + shop.eco.join('、');
      if (shop.featured) eco += ' (精選推薦)';
      out.push({ shopId: shop.id, type: 'eco', text: eco });
    }

    if (!shop.isBranch) {
      var branches = all.filter(function(s){ return s && s.isBranch && s.parentId === shop.id });
      if (branches.length) {
        var bt = shop.name + ' 分店 (' + branches.length + '間):\n';
        bt += branches.map(function(b){ return '- ' + b.name + (b.address ? ' | ' + b.address : '') }).join('\n');
        out.push({ shopId: shop.id, type: 'branches', text: bt });
      }
    }

    var final = [];
    out.forEach(function(c) {
      if (c.text.length <= CHUNK_MAX) { final.push(c); return; }
      var lines = c.text.split('\n'), buf = '', idx = 0;
      for (var i = 0; i < lines.length; i++) {
        if (buf.length + lines[i].length + 1 > CHUNK_MAX && buf) {
          final.push({ shopId: c.shopId, type: c.type + '_p' + (++idx), text: buf });
          buf = '';
        }
        buf += (buf ? '\n' : '') + lines[i];
      }
      if (buf) final.push({ shopId: c.shopId, type: c.type + (idx ? '_p' + (idx+1) : ''), text: buf });
    });
    return final;
  }

  function buildIndex(rawShops) {
    var cleaned = rawShops.map(cleanDoc).filter(Boolean);
    var chunks = [];
    cleaned.forEach(function(s) {
      chunkShop(s, cleaned).forEach(function(c){ chunks.push(c) });
    });
    return chunks;
  }

  // term-frequency keyword search - sufficient before embeddings
  function search(chunks, query, topK) {
    topK = topK || 5;
    var q = query.toLowerCase();
    var terms = q.split(/\s+/).filter(function(t){ return t.length > 1 });

    var scored = [];
    for (var i = 0; i < chunks.length; i++) {
      var text = chunks[i].text.toLowerCase();
      var score = 0;
      if (text.indexOf(q) !== -1) score += 10;
      for (var j = 0; j < terms.length; j++) {
        var pos = 0;
        while ((pos = text.indexOf(terms[j], pos)) !== -1) { score++; pos += terms[j].length; }
      }
      if (score > 0) scored.push({ chunk: chunks[i], score: score });
    }

    scored.sort(function(a,b){ return b.score - a.score });
    return scored.slice(0, topK).map(function(s){ return s.chunk });
  }

  function toContext(chunks) {
    return chunks.map(function(c){ return c.text }).join('\n---\n');
  }

  return { buildIndex: buildIndex, search: search, toContext: toContext, cleanDoc: cleanDoc };
})();

window.RAG = RAG;
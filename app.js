(function () {
  'use strict';
  var embedded = {};
  try { embedded = JSON.parse(document.getElementById('content-data').textContent || '{}'); } catch (_) {}
  var C = window.CONTENT || embedded;
  var data = function (key) { return Array.isArray(C[key]) ? C[key] : []; };
  var byId = function (id) { return document.getElementById(id); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); };
  var asText = function (v) { return Array.isArray(v) ? v.join(' · ') : (v == null ? '' : String(v)); };
  var list = function (v) { return Array.isArray(v) ? v : (v ? String(v).split(/\s*[→·；]\s*/).filter(Boolean) : []); };
  var safeUrl = function (url) { return /^(https?:\/\/|mailto:|#)/i.test(String(url || '')) ? String(url) : '#evidence'; };
  var put = function (id, html) { if (byId(id)) byId(id).innerHTML = html; };
  var setText = function (id, text) { if (byId(id)) byId(id).textContent = text || ''; };
  var sources = data('sources');
  var products = data('products');
  var productMap = {};
  products.forEach(function (p) { productMap[p.id] = p; });
  var source = function (value, label) {
    if (!value) return '';
    var ref = Array.isArray(value) ? value[0] : value;
    var found = sources.find(function (s) { return s.id === ref || s.url === ref; });
    var url = found ? found.url : (typeof ref === 'object' ? ref.url : ref);
    var title = label || (found ? found.title : '查看来源');
    return '<a class="source-link" href="' + esc(safeUrl(url)) + '" target="_blank" rel="noopener noreferrer" title="' + esc(title) + '">' + esc(label || '来源') + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a>';
  };
  var status = function (value) {
    var s = asText(value);
    var cls = /历史|快照|对接|规划|方案|待|讨论|试点|原型|范围确认|商务确认/.test(s) ? (/历史|快照/.test(s) ? 'historical' : 'discuss') : 'available';
    return s ? '<span class="status ' + cls + '">' + esc(s) + '</span>' : '';
  };
  var productButton = function (id, cls) {
    var p = productMap[id];
    return p ? '<button class="' + (cls || 'product-chip') + '" data-product="' + esc(id) + '">' + esc(p.name) + '<span>↗</span></button>' : '';
  };
  var format = function (n) { return Number(n).toLocaleString('zh-CN', {maximumFractionDigits:2}); };
  var decode = function (text) { try { return decodeURIComponent(text); } catch (_) { return text; } };
  var metricHTML = function (m, cls) {
    return '<article class="' + cls + '"><div class="metric-value">' + esc(m.value) + '</div><div class="metric-label">' + esc(m.label) + '</div>' + (m.scope ? '<p class="metric-scope">' + esc(m.scope) + '</p>' : '') + (m.date ? '<p class="metric-date">截至 ' + esc(m.date) + '</p>' : '') + (m.note ? '<p class="impact-note">' + esc(m.note) + '</p>' : '') + source(m.source) + '</article>';
  };
  var toastTimer;
  function toast(text) {
    setText('toast', text);
    byId('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { byId('toast').classList.remove('show'); }, 3000);
  }
  async function copyText(text, success) {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('fallback');
      await navigator.clipboard.writeText(text);
    } catch (_) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy'); ta.remove();
      if (!ok) { toast('当前浏览器不支持复制，请使用下载文件。'); return; }
    }
    toast(success || '已复制');
  }
  function download(text, name, type) {
    var url = URL.createObjectURL(new Blob(['\ufeff', text], { type: type || 'text/plain;charset=utf-8' }));
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  function renderFoundation() {
    var meta = C.meta || {};
    document.title = meta.title ? meta.title + ' · 盈米 AI' : document.title;
    setText('hero-tagline', meta.tagline || '金融专业 × AI 原生 × 开放生态');
    setText('hero-subtitle', meta.subtitle || '');
    setText('hero-edition', 'BUSINESS EDITION / V' + (meta.version || '1.0'));
    setText('rail-version', (meta.date || '2026-11-09').replace(/-/g, ' / '));
    setText('edition-label', 'V' + (meta.version || '1.0') + ' · ' + (meta.date || '') + ' · ' + (meta.title || '盈米 AI 能力体系'));
    var company = C.company || {};
    setText('company-intro', company.intro);
    if (company.source) put('company-source', source(company.source));
    put('brand-row', (company.brands || []).map(function (b) { return '<article class="brand-item"><h3>' + esc(b.name) + '</h3><p>' + esc(b.desc) + '</p></article>'; }).join(''));
    if (company.brands && company.brands.length > 3) byId('brand-row').classList.add('four-columns');
    put('company-metrics', (company.metrics || []).map(function (m) { return metricHTML(m, 'company-metric'); }).join(''));
    var strategy = C.strategy || {};
    setText('strategy-intro', strategy.intro);
    put('strategy-steps', (strategy.steps || []).map(function (s,i) { return '<article class="strategy-step"><span>0' + (i+1) + '</span><h4>' + esc(s.name) + '</h4><p>' + esc(s.desc) + '</p></article>'; }).join(''));
    if ((strategy.steps || []).length > 3) byId('strategy-steps').classList.add('four-columns');
    put('strategy-source', source(strategy.source));
  }

  function renderBlueprint() {
    var domains = [
      {name:'个人服务',ids:['xiaogu']},
      {name:'顾问与机构服务',ids:['huiketong','tamp']},
      {name:'投研分析',ids:['vesta']},
      {name:'内容生产',ids:['editor']},
      {name:'合规审核',ids:['ccs']},
      {name:'公告作业',ids:['announcement']}
    ];
    put('blueprint-apps', domains.map(function (d,i) {
      var entries = d.ids.map(function (id) { return productMap[id]; }).filter(Boolean);
      return '<div class="blueprint-app blueprint-domain"><span>0' + (i+1) + ' / ' + esc(d.name) + '</span><div class="blueprint-domain-links">' + entries.map(function (p) { return '<button data-product="' + esc(p.id) + '">' + esc(p.name) + '<b>↗</b></button>'; }).join('') + '</div><small>' + esc(entries.length ? entries[0].for : '') + '</small></div>';
    }).join(''));
    var open = ['mcp','skills','agent'].map(function (id) { return productMap[id]; }).filter(Boolean);
    put('blueprint-open', open.map(function (p) { return '<button class="open-product" data-product="' + esc(p.id) + '"><strong>' + esc(p.id === 'mcp' ? 'MCP' : p.id === 'skills' ? 'Skills' : 'Agents') + '</strong><span>' + esc(p.desc) + '</span></button>'; }).join(''));
    if (productMap.benchmark && !byId('foundation-benchmark')) {
      var chip = document.createElement('button');
      chip.id = 'foundation-benchmark'; chip.className = 'foundation-benchmark'; chip.dataset.product = 'benchmark';
      chip.innerHTML = '<span>质量评测支撑</span>' + esc(productMap.benchmark.name) + '<b>↗</b>';
      byId('blueprint-foundation').appendChild(chip);
    }
  }

  var productFilter = '全部', productQuery = '', showAllProducts = false;
  function renderProductFilters() {
    var cats = ['全部'].concat(Array.from(new Set(products.map(function (p) { return p.category; }).filter(Boolean))));
    put('product-filters', cats.map(function (c) { return '<button class="filter-tab' + (c === productFilter ? ' active' : '') + '" data-product-filter="' + esc(c) + '">' + esc(c) + '</button>'; }).join(''));
  }
  function renderProducts() {
    renderProductFilters();
    var filtered = products.filter(function (p) { return (productFilter === '全部' || p.category === productFilter) && (!productQuery || [p.name,p.desc,p.for,p.input,p.output,p.delivery].join(' ').toLowerCase().includes(productQuery)); });
    var visible = productFilter === '全部' && !productQuery && !showAllProducts ? filtered.slice(0,6) : filtered;
    put('product-grid', visible.map(function (p) { return '<button class="product-card" data-product="' + esc(p.id) + '"><div class="product-topline"><span class="product-category">' + esc(p.category) + '</span>' + status(p.status) + '</div><h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p><div class="product-for"><span>FOR</span><span>' + esc(p.for) + '</span><b>↗</b></div></button>'; }).join(''));
    byId('product-empty').hidden = filtered.length > 0;
    setText('product-count', products.length + ' 个产品与能力入口');
    var toggle = byId('product-show-all');
    if (!toggle) { toggle = document.createElement('button'); toggle.id = 'product-show-all'; toggle.className = 'section-expand'; byId('product-empty').after(toggle); }
    toggle.hidden = productFilter !== '全部' || !!productQuery || filtered.length <= 6;
    toggle.setAttribute('aria-expanded', String(showAllProducts));
    toggle.innerHTML = showAllProducts ? '收起产品全景 <span>−</span>' : '展开全部 ' + products.length + ' 个产品与能力入口 <span>＋</span>';
  }
  function renderInventory() {
    put('domain-grid', data('domains').map(function (d,i) { return '<article class="domain-item"><span class="domain-number">0' + (i+1) + '</span><h4>' + esc(d.name) + '</h4><p>' + esc(d.desc) + '</p><div class="domain-examples">' + list(d.examples).map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div></article>'; }).join(''));
    var groups = {};
    data('tools').forEach(function (t) { var g = t.group || '专业工具'; if (!groups[g]) groups[g] = []; groups[g].push(t); });
    setText('tool-count', data('tools').length + ' 项 · 官方 README 历史快照，非实时全集');
    put('tool-groups', Object.keys(groups).map(function (g) { return '<div class="tool-group"><h5>' + esc(g) + '</h5><div>' + groups[g].map(function (t) { return '<span class="tool-chip">' + esc(t.name) + '<small>' + esc(t.id) + '</small></span>'; }).join('') + '</div></div>'; }).join(''));
    setText('skill-count', data('skills').length + ' 项 · 官方公开路由样本，非实时全集');
    put('skill-grid', data('skills').map(function (s) { return '<article class="skill-item"><strong>' + esc(s.name) + '</strong><p>' + esc(s.desc) + '</p></article>'; }).join(''));
  }

  var activeCase = 0, allCasesOpen = false;
  var cases = data('cases');
  function caseImage(c) {
    var simulated = /模拟|示意|概念|示例/.test(c.kind || '');
    return '<button class="case-image-wrap" data-image="' + esc(c.id) + '" aria-label="放大查看：' + esc(c.title) + '"><span class="image-kind' + (simulated ? ' simulated' : '') + '">' + esc(c.kind || '场景展示') + '</span><img src="' + esc(c.image || '') + '" alt="' + esc(c.caption || c.title) + '" loading="lazy"><span class="image-enlarge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>点击放大</span></button>';
  }
  function renderCase() {
    if (!cases.length) { put('case-feature','<p class="empty-state">案例资料持续补充中。</p>'); return; }
    var c = cases[activeCase] || cases[0];
    var p = productMap[c.product];
    var workflow = list(c.workflow);
    put('case-feature', caseImage(c) + '<article class="case-info"><div class="case-topline"><span>' + esc(c.tag || '场景案例') + '</span><span>' + (activeCase+1).toString().padStart(2,'0') + ' / ' + cases.length.toString().padStart(2,'0') + '</span></div><h3>' + esc(c.title) + '</h3><div class="case-detail"><span>问题</span><p>' + esc(c.problem) + '</p></div><div class="case-detail"><span>流程</span><div class="case-workflow">' + workflow.map(function (s,i) { return (i ? '<i>→</i>' : '') + '<span>' + esc(s) + '</span>'; }).join('') + '</div></div><div class="case-detail"><span>成果</span><p>' + esc(c.output) + '</p></div><div class="case-proof">' + esc(c.proof) + '</div>' + source(c.source, '案例依据') + '<p class="case-caption">' + esc(c.caption) + (p ? ' · ' + esc(p.name) : '') + '</p></article>');
    put('case-tabs', cases.map(function (s,i) { return '<button class="case-tab' + (i === activeCase ? ' active' : '') + '" role="tab" aria-selected="' + (i === activeCase) + '" data-case="' + i + '">' + String(i+1).padStart(2,'0') + ' ' + esc(s.tag || s.title) + '</button>'; }).join(''));
    if (allCasesOpen) renderCaseGallery();
  }
  function renderCaseGallery() {
    put('case-gallery', cases.map(function (c) { return '<article class="case-mini">' + caseImage(c) + '<div class="case-mini-info"><span>' + esc(c.tag) + '</span><h4>' + esc(c.title) + '</h4><p>' + esc(c.output) + '</p><p class="case-caption">' + esc(c.proof) + '</p>' + source(c.source, '案例依据') + '</div></article>'; }).join(''));
  }
  function showImage(id) {
    var c = cases.find(function (s) { return s.id === id; });
    if (!c || !c.image) return;
    var image = byId('lightbox-image'); image.src = c.image; image.alt = c.caption || c.title;
    setText('lightbox-caption', (c.kind || '场景展示') + ' · ' + c.title + ' — ' + (c.caption || ''));
    byId('image-dialog').showModal();
  }

  var platformFilter = '全部', showAllPlatforms = false;
  var platforms = data('platforms');
  function renderPlatforms() {
    var cats = ['全部'].concat(Array.from(new Set(platforms.map(function (p) { return p.type; }).filter(Boolean))));
    put('platform-filters', cats.map(function (s) { return '<button class="filter-tab' + (platformFilter === s ? ' active' : '') + '" data-platform-filter="' + esc(s) + '">' + esc(s) + '</button>'; }).join(''));
    var filtered = platforms.filter(function (p) { return platformFilter === '全部' || p.type === platformFilter; });
    var visible = platformFilter === '全部' && !showAllPlatforms ? filtered.slice(0,8) : filtered;
    setText('platform-count', filtered.length + ' 项入口与关系');
    put('platform-table', visible.map(function (p) { return '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.type) + '</td><td>' + status(p.status) + '</td><td>' + esc(p.scope) + '</td><td>' + source(p.source) + '</td></tr>'; }).join(''));
    var toggle = byId('platform-show-all');
    if (!toggle) { toggle = document.createElement('button'); toggle.id = 'platform-show-all'; toggle.className = 'section-expand'; byId('platform-table').closest('.table-scroll').after(toggle); }
    toggle.hidden = platformFilter !== '全部' || platforms.length <= 8;
    toggle.innerHTML = showAllPlatforms ? '收起生态关系 <span>−</span>' : '查看全部 ' + platforms.length + ' 项生态入口与合作关系 <span>＋</span>';
    toggle.setAttribute('aria-expanded', String(showAllPlatforms));
  }
  function renderEcosystemLabels() {
    var pick = platforms.filter(function (p) { return !/历史|兼容|规划|金融机构/.test((p.status || '')+' '+(p.type || '')); }).slice(0,8);
    put('ecosystem-labels', pick.map(function (p) { return '<span>' + esc(p.name) + '<small>' + esc(p.type) + '</small></span>'; }).join(''));
  }

  var timelineExpanded = false;
  function renderImpact() {
    put('impact-metrics', data('metrics').map(function (m) { return metricHTML(m, 'impact-item'); }).join(''));
    var all = data('milestones');
    var visible = timelineExpanded ? all : all.slice(-5);
    put('timeline', visible.map(function (m) { return '<article class="timeline-item"><span class="timeline-date">' + esc(m.date) + '</span><h4>' + esc(m.title) + '</h4><div><p>' + esc(m.desc) + '</p>' + source(m.source) + '</div></article>'; }).join(''));
    var toggle = byId('timeline-show-all');
    if (!toggle) { toggle = document.createElement('button'); toggle.id = 'timeline-show-all'; toggle.className = 'section-expand'; byId('timeline').after(toggle); }
    toggle.hidden = all.length <= 5;
    toggle.innerHTML = timelineExpanded ? '收起时间线 <span>−</span>' : '展开全部 ' + all.length + ' 项里程碑与认可 <span>＋</span>';
    toggle.setAttribute('aria-expanded', String(timelineExpanded));
  }
  function renderPositioning() {
    put('comparison-table', data('competitors').map(function (p) { return '<tr><td><strong>' + esc(p.name) + '</strong>' + source(p.source) + '</td><td>' + esc(p.position) + '</td><td>' + esc(p.capability) + '</td><td>' + esc(p.relation) + '</td><td>' + esc(p.difference) + '</td></tr>'; }).join(''));
  }

  var audiences = data('audiences'), audienceIndex = 0, objective = 0;
  function renderAudiencePicker() {
    put('audience-select', audiences.map(function (a,i) { return '<option value="' + i + '"' + (i === audienceIndex ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join(''));
    put('audience-objectives', ['解决当下的业务问题','快速验证能力与价值','讨论更深的合作方式'].map(function (s,i) { return '<button class="objective-button' + (objective === i ? ' active' : '') + '" data-objective="' + i + '"><i></i>' + esc(s) + '</button>'; }).join(''));
    renderAudienceResult();
  }
  function renderAudienceResult() {
    var a = audiences[audienceIndex];
    if (!a) return;
    var details = objective === 1 ? [['试点切口',a.pilot],['验收依据',a.acceptance],['接入方式',a.delivery],['费用路径',a.billing]] : objective === 2 ? [['交付与集成',a.delivery],['计费与授权',a.billing],['试点到规模化',a.pilot],['验证与升级',a.acceptance]] : [['接入与交付',a.delivery],['计费路径',a.billing],['试点建议',a.pilot],['如何验收',a.acceptance]];
    var title = asText(a.solution).replace(/^方案建议[｜|：:·\s]*/,'');
    put('audience-result', '<div class="solution-kicker"><span>YOUR WAY IN / ' + String(audienceIndex+1).padStart(2,'0') + '</span><span>方案建议 · 按需确认</span></div><h3>' + esc(title) + '</h3><p class="solution-need">' + esc(a.need) + '</p><div class="product-chips">' + (a.products || []).map(function (id) { return productButton(id); }).join('') + '</div><div class="solution-grid">' + details.map(function (d) { return '<div class="solution-item"><span>' + esc(d[0]) + '</span><p>' + esc(d[1]) + '</p></div>'; }).join('') + '</div><div class="solution-next"><span>' + esc(a.next) + '</span><button class="solution-brief-button" data-use-solution aria-label="将此方案带入合作简报">↗</button></div>');
  }
  function renderExtensions() {
    put('extension-grid', data('extensions').map(function (s) { return '<article class="extension-item"><h4>' + esc(s.name) + '</h4><p>' + esc(s.desc) + '</p></article>'; }).join(''));
  }
  function renderAudienceTable() {
    put('audience-table', audiences.map(function (a) {
      return '<tr><td>' + esc(a.name) + '</td><td>' + esc(a.need) + '</td><td><div class="audience-table-products">' + (a.products || []).map(function (id) { return productButton(id); }).join('') + '</div></td><td>' + esc(a.delivery) + '</td><td>' + esc(a.billing) + '</td><td><strong>试点</strong>' + esc(a.pilot) + '<strong>验收</strong>' + esc(a.acceptance) + '</td></tr>';
    }).join(''));
    byId('audience-table-toggle').innerHTML = '展开 ' + audiences.length + ' 类客群方案表 <span>＋</span>';
  }
  function useSolution() {
    var a = audiences[audienceIndex];
    if (!a) return;
    var f = byId('brief-form');
    f.elements.persona.value = a.name;
    f.elements.goal.value = a.need;
    f.elements.acceptance.value = a.acceptance;
    if (!f.elements.entry.value) f.elements.entry.value = a.delivery;
    location.hash = 'brief-builder';
    toast('已将当前方案带入合作简报，可继续补充。');
  }

  var modelsExpanded = false;
  function renderModels() {
    var all = data('models'), visible = modelsExpanded ? all : all.slice(0,4);
    put('models-table', visible.map(function (m) { return '<tr><td>' + esc(m.name) + '</td><td>' + esc(m.buyer) + '</td><td>' + esc(m.deliverable) + '</td><td>' + esc(m.billing) + '</td><td>' + esc(m.rights) + '<span>下一步：' + esc(m.next) + '</span></td></tr>'; }).join(''));
    var toggle = byId('models-show-all');
    if (!toggle) { toggle = document.createElement('button'); toggle.id = 'models-show-all'; toggle.className = 'section-expand'; byId('models-table').closest('.table-scroll').after(toggle); }
    toggle.hidden = all.length <= 4;
    toggle.innerHTML = modelsExpanded ? '收起合作模式 <span>−</span>' : '打开全部 ' + all.length + ' 种合作路径 <span>＋</span>';
    toggle.setAttribute('aria-expanded', String(modelsExpanded));
  }
  function renderPricing() {
    put('pricing-grid', data('pricing').map(function (p,i) {
      return '<article class="price-item"><span class="eyebrow">ONE KEY MCP / 0' + (i+1) + '</span><h4>' + esc(p.name.replace(/^盈米[-—\s]*/,'')) + '</h4><span class="price-tools">' + esc(p.tools) + ' 项金融工具</span><div class="price-number"><span>¥</span>' + esc(p.price) + '</div><span class="price-unit">' + esc(p.unit) + ' · 按量计费</span><p class="price-trial">' + esc(p.trial) + '</p><p class="price-scope">' + esc(p.scope) + '</p><a class="price-link" href="' + esc(safeUrl(p.url)) + '" target="_blank" rel="noopener noreferrer">查看平台实时规格 <span>↗</span></a></article>';
    }).join(''));
    var first = data('pricing')[0];
    if (first && first.verifiedAt) setText('pricing-date',first.verifiedAt);
    renderBudget();
  }
  function renderBudget() {
    var calls = Number(byId('budget-calls').value);
    setText('budget-output', format(calls) + ' 次');
    put('budget-results', data('pricing').map(function (p) { return '<div class="budget-result"><span>' + esc(p.name.replace(/^盈米[-—\s]*/,'')) + '</span><strong>¥' + format(calls*Number(p.price)) + '</strong></div>'; }).join(''));
  }
  function renderGuides() {
    var all = data('guides');
    put('guide-grid', all.map(function (g,i) { return '<article class="guide-item"><span class="guide-number">PATH / 0' + (i+1) + '</span><h3>' + esc(g.name) + '</h3><ol>' + (g.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><a href="' + esc(safeUrl(g.url)) + '" target="_blank" rel="noopener noreferrer">打开官方入口 <span>↗</span></a></article>'; }).join(''));
    if (all.length > 3) byId('guide-grid').classList.add('four-columns');
  }
  function renderSources() {
    put('source-list', sources.map(function (s,i) { return '<a class="source-item" href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer" id="source-' + esc(s.id) + '"><span>' + String(i+1).padStart(2,'0') + '</span><div><strong>' + esc(s.title) + '</strong><small>' + esc(s.date) + ' · ' + esc((s.url || '').replace(/^https?:\/\//,'').replace(/\/$/,'')) + '</small></div><b>↗</b></a>'; }).join(''));
  }

  function openProduct(id) {
    var p = productMap[id];
    if (!p) return;
    put('dialog-content','<div class="dialog-heading"><span class="eyebrow">' + esc(p.category) + '</span>' + status(p.status) + '</div><h2 id="dialog-title">' + esc(p.name) + '</h2><p class="dialog-desc">' + esc(p.desc) + '</p><div class="dialog-detail-grid">' + [['服务谁',p.for],['需要什么输入',p.input],['交付什么成果',p.output],['如何接入与交付',p.delivery]].map(function (s) { return '<div><span>' + esc(s[0]) + '</span><p>' + esc(s[1]) + '</p></div>'; }).join('') + '</div><div class="dialog-actions"><button class="button primary" data-product-cooperate="' + esc(id) + '">探索合作方案 <span>↗</span></button>' + source(p.source, '产品公开依据') + '</div><p class="dialog-note">产品范围、开放权限、版本与交付成熟度按来源及具体方案确认；不由展示图推导为所有功能已开放。</p>');
    byId('product-dialog').showModal();
    if (history.replaceState) history.replaceState(null,'',location.pathname+location.search+'#product='+encodeURIComponent(id));
  }
  function closeProduct() {
    byId('product-dialog').close();
    if (/^#product=/.test(location.hash)) history.replaceState(null,'',location.pathname+location.search+'#products');
  }
  function briefText() {
    var f = byId('brief-form'), v = function (key) { return f.elements[key].value.trim() || '待沟通确认'; };
    return '盈米 AI 合作需求简报\n\n日期：' + ((C.meta || {}).date || '') + '\n机构 / 团队：' + v('organization') + '\n使用者 / 身份：' + v('persona') + '\n\n希望完成的业务任务：\n' + v('goal') + '\n\n已有入口 / 平台：' + v('entry') + '\n数据与使用范围：' + v('scope') + '\n预计用量 / 规模：' + v('usage') + '\n希望如何验收：' + v('acceptance') + '\n\n待双方确认：产品与授权范围、交付内容、数据边界、计费与预算、验收标准、运维支持、双方负责人。\n\n官方联系：oap@yingmi.cn\n资料版本：V' + ((C.meta || {}).version || '1.0') + '\n';
  }

  var chapters = Array.from(document.querySelectorAll('section[data-chapter]'));
  var presentation = false;
  var currentChapter = -1;
  function updateReading() {
    var scrollTop = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    byId('reading-progress').style.width = Math.max(0,Math.min(100,(scrollTop / (max || 1))*100))+'%';
    var index = -1;
    chapters.forEach(function (s,i) { if (s.getBoundingClientRect().top < window.innerHeight*0.38) index = i; });
    currentChapter = index;
    document.querySelectorAll('#chapter-nav a').forEach(function (a,i) { a.classList.toggle('active',i === index); });
    setText('reading-label', index < 0 ? '从全景开始' : String(index+1).padStart(2,'0') + ' / ' + chapters[index].dataset.chapter);
    setText('present-position', (index+2) + ' / ' + (chapters.length+1));
  }
  function setPresentation(value) {
    presentation = value;
    document.body.classList.toggle('presentation',value);
    setText('present-button',value ? '退出演示' : '演示模式');
    byId('present-button').setAttribute('aria-pressed',String(value));
    updateReading();
    if (value) toast('已进入演示模式 · ← → 切换章节 · ESC 退出');
  }
  function changeChapter(delta) {
    var targets = [byId('top')].concat(chapters);
    var index = Math.max(0,Math.min(targets.length-1,currentChapter+1+delta));
    targets[index].scrollIntoView({behavior:'smooth',block:'start'});
  }
  function applyHash() {
    if (/^#product=/.test(location.hash)) {
      var id = decode(location.hash.substring(9));
      if (productMap[id] && !byId('product-dialog').open) openProduct(id);
    }
    if (/^#audience=/.test(location.hash)) {
      var aid = decode(location.hash.substring(10));
      var idx = audiences.findIndex(function (a) { return a.id === aid; });
      if (idx >= 0) { audienceIndex = idx; renderAudiencePicker(); byId('cooperate').scrollIntoView(); }
    }
    if (/^#case=/.test(location.hash)) {
      var cid = decode(location.hash.substring(6));
      var ci = cases.findIndex(function (c) { return c.id === cid; });
      if (ci >= 0) { activeCase = ci; renderCase(); byId('cases').scrollIntoView(); }
    }
  }
  function setupEvents() {
    document.addEventListener('click',function (e) {
      var p = e.target.closest('[data-product]');
      if (p) { openProduct(p.dataset.product); return; }
      var pc = e.target.closest('[data-product-cooperate]');
      if (pc) {
        var id = pc.dataset.productCooperate;
        closeProduct();
        var match = audiences.findIndex(function (a) { return (a.products || []).includes(id); });
        if (match >= 0) { audienceIndex = match; renderAudiencePicker(); }
        location.hash = 'cooperate'; return;
      }
      var f = e.target.closest('[data-product-filter]');
      if (f) { productFilter = f.dataset.productFilter; renderProducts(); return; }
      var c = e.target.closest('[data-case]');
      if (c) { activeCase = Number(c.dataset.case); renderCase(); if (history.replaceState) history.replaceState(null,'',location.pathname+location.search+'#case='+encodeURIComponent(cases[activeCase].id)); return; }
      var image = e.target.closest('[data-image]');
      if (image) { showImage(image.dataset.image); return; }
      var pf = e.target.closest('[data-platform-filter]');
      if (pf) { platformFilter = pf.dataset.platformFilter; renderPlatforms(); return; }
      var o = e.target.closest('[data-objective]');
      if (o) { objective = Number(o.dataset.objective); renderAudiencePicker(); return; }
      if (e.target.closest('[data-use-solution]')) { useSolution(); return; }
      if (e.target.closest('[data-close-dialog]')) { closeProduct(); return; }
      if (e.target.closest('[data-close-image]')) { byId('image-dialog').close(); return; }
      if (e.target.closest('#product-show-all')) { showAllProducts = !showAllProducts; renderProducts(); if (!showAllProducts) byId('products').scrollIntoView({behavior:'smooth'}); return; }
      if (e.target.closest('#platform-show-all')) { showAllPlatforms = !showAllPlatforms; renderPlatforms(); return; }
      if (e.target.closest('#timeline-show-all')) { timelineExpanded = !timelineExpanded; renderImpact(); return; }
      if (e.target.closest('#models-show-all')) { modelsExpanded = !modelsExpanded; renderModels(); return; }
    });
    byId('product-search').addEventListener('input',function (e) { productQuery = e.target.value.trim().toLowerCase(); renderProducts(); });
    byId('inventory-toggle').addEventListener('click',function () { var open = byId('inventory').hidden; byId('inventory').hidden = !open; this.setAttribute('aria-expanded',String(open)); this.innerHTML = (open ? '收起' : '展开') + '工具与 Skills 目录 <span>' + (open ? '−' : '＋') + '</span>'; });
    byId('case-expand').addEventListener('click',function () { allCasesOpen = !allCasesOpen; if (allCasesOpen) renderCaseGallery(); byId('case-gallery').hidden = !allCasesOpen; this.setAttribute('aria-expanded',String(allCasesOpen)); this.innerHTML = (allCasesOpen ? '收起全部案例' : '展开全部案例') + ' <span>' + (allCasesOpen ? '−' : '＋') + '</span>'; });
    byId('audience-select').addEventListener('change',function (e) { audienceIndex = Number(e.target.value); renderAudienceResult(); if (history.replaceState && audiences[audienceIndex]) history.replaceState(null,'',location.pathname+location.search+'#audience='+encodeURIComponent(audiences[audienceIndex].id)); });
    byId('budget-calls').addEventListener('input',renderBudget);
    byId('audience-table-toggle').addEventListener('click',function () {
      var open = byId('audience-comparison-panel').hidden;
      byId('audience-comparison-panel').hidden = !open;
      this.setAttribute('aria-expanded',String(open));
      this.innerHTML = (open ? '收起' : '展开') + ' ' + audiences.length + ' 类客群方案表 <span>' + (open ? '−' : '＋') + '</span>';
    });
    byId('brief-form').addEventListener('submit',function (e) { e.preventDefault(); });
    byId('brief-copy').addEventListener('click',function () { copyText(briefText(),'合作简报已复制，可发往官方联系邮箱。'); });
    byId('brief-download').addEventListener('click',function () { download(briefText(),'盈米AI合作需求简报.txt'); toast('合作简报已下载。'); });
    byId('print-button').addEventListener('click',function () { showAllProducts = true; showAllPlatforms = true; timelineExpanded = true; modelsExpanded = true; allCasesOpen = true; renderProducts(); renderPlatforms(); renderImpact(); renderModels(); renderCaseGallery(); window.print(); });
    byId('present-button').addEventListener('click',function () { setPresentation(!presentation); });
    byId('present-exit').addEventListener('click',function () { setPresentation(false); });
    byId('present-prev').addEventListener('click',function () { changeChapter(-1); });
    byId('present-next').addEventListener('click',function () { changeChapter(1); });
    byId('share-button').addEventListener('click',function () {
      var hash = /^#(product|case|audience)=/.test(location.hash) ? location.hash : (currentChapter >= 0 ? '#'+chapters[currentChapter].id : '#top');
      copyText(location.href.split('#')[0]+hash,'当前章节链接已复制。');
    });
    byId('product-dialog').addEventListener('click',function (e) { if (e.target === this) closeProduct(); });
    byId('product-dialog').addEventListener('cancel',function () { if (/^#product=/.test(location.hash)) history.replaceState(null,'',location.pathname+location.search+'#products'); });
    byId('image-dialog').addEventListener('click',function (e) { if (e.target === this) this.close(); });
    document.addEventListener('keydown',function (e) {
      if (e.key === 'Escape' && presentation && !byId('product-dialog').open && !byId('image-dialog').open) setPresentation(false);
      if (!presentation || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || byId('product-dialog').open || byId('image-dialog').open) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); changeChapter(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); changeChapter(-1); }
    });
    var raf = false;
    window.addEventListener('scroll',function () { if (!raf) { requestAnimationFrame(function () { updateReading(); raf = false; }); raf = true; } },{passive:true});
    window.addEventListener('hashchange',applyHash);
  }
  function addEvidenceNotes() {
    var impactNote = byId('impact').querySelector('.section-note');
    if (impactNote) impactNote.textContent = '公司公开披露的历史快照，非独立审计。不同日期、口径与范围的指标分别保留，不直接相加，也不推导因果。';
    var title = byId('cases').querySelector('.section-index>span:last-child');
    if (title) title.textContent = '场景演示与公开案例';
    var inventoryNote = document.createElement('p'); inventoryNote.className = 'inventory-note';
    inventoryNote.textContent = '69 项工具为官方 README 快照，11 项 Skills 为公开路由样本；与官网 72 项或其他版本的能力数量范围不同，不合并统计。';
    byId('inventory').prepend(inventoryNote);
  }
  renderFoundation(); renderBlueprint(); renderProducts(); renderInventory(); renderCase(); renderEcosystemLabels(); renderPlatforms(); renderImpact(); renderPositioning(); renderAudiencePicker(); renderExtensions(); renderAudienceTable(); renderModels(); renderPricing(); renderGuides(); renderSources(); addEvidenceNotes(); setupEvents(); updateReading(); applyHash();
  window.YINGMI_SITE = { content:C, refresh:function () { location.reload(); }, openProduct:openProduct, showCase:function (id) { var i=cases.findIndex(function(c){return c.id===id;}); if(i>=0){activeCase=i;renderCase();byId('cases').scrollIntoView();} } };
})();

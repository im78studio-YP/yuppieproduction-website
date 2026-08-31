(function initAIRenderIntent(global) {
  'use strict';

  const INTENTS = Object.freeze({
    CONCEPT: 'concept',
    FROM_3D: 'from3d'
  });
  const QUALITY = Object.freeze({ PREVIEW: 'preview', FINAL: 'final' });
  const RENDER_ONLY_TYPES = new Set(['people', 'person', 'product', 'products', 'prop', 'props']);

  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const text = (value, fallback = '') => String(value ?? fallback).trim();
  const normalizeIntent = value => value === INTENTS.CONCEPT ? INTENTS.CONCEPT : INTENTS.FROM_3D;
  const normalizeQuality = value => value === QUALITY.FINAL ? QUALITY.FINAL : QUALITY.PREVIEW;
  const normalizeDimensions = source => ({
    w: Math.max(.01, number(source?.w ?? source?.width, 1)),
    d: Math.max(.01, number(source?.d ?? source?.depth, 1)),
    h: Math.max(.01, number(source?.h ?? source?.height, 1))
  });

  function normalizeSuggestedAsset(source = {}, index = 0) {
    const category = text(source.category || source.type, 'decor').toLowerCase();
    const id = text(source.id, `suggestion-${index + 1}`);
    const renderOnly = source.renderOnly === true || RENDER_ONLY_TYPES.has(category);
    return {
      id,
      name: text(source.name || source.label, `AI Suggested ${index + 1}`),
      category,
      dimensions: normalizeDimensions(source.dimensions || source.size),
      position: source.position && typeof source.position === 'object' ? {
        x: number(source.position.x), y: number(source.position.y), z: number(source.position.z)
      } : null,
      rotationY: number(source.rotationY ?? source.rotation_y_deg),
      reason: text(source.reason || source.intent),
      renderOnly,
      status: renderOnly ? 'Render Staging เท่านั้น' : 'AI Suggested',
      confirmed: false,
      matchedCatalogId: null
    };
  }

  function parseMaybeJSON(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try { return JSON.parse(String(value)); } catch (_) { return null; }
  }

  function normalizeSceneProposal(result = {}) {
    const root = parseMaybeJSON(result.sceneProposal) || parseMaybeJSON(result.proposal) ||
      parseMaybeJSON(result.scene_proposal) || parseMaybeJSON(result.output?.sceneProposal) || {};
    const assets = Array.isArray(root.suggestedAssets) ? root.suggestedAssets :
      Array.isArray(root.suggested_assets) ? root.suggested_assets : [];
    return {
      version: Math.max(1, Math.round(number(root.version, 1))),
      renderIntent: INTENTS.CONCEPT,
      summary: text(root.summary || root.designSummary),
      zones: Array.isArray(root.zones) ? root.zones : [],
      suggestedAssets: assets.map(normalizeSuggestedAsset),
      raw: root
    };
  }

  function categoryAliases(value) {
    const category = text(value).toLowerCase();
    const aliases = {
      furniture: ['reception', 'hospitality', 'display', 'furniture', 'counter', 'chair', 'table', 'shelf'],
      counter: ['reception', 'counter'], chair: ['hospitality', 'chair'], table: ['hospitality', 'table'],
      display: ['display', 'shelf', 'display'], lighting: ['lighting', 'light'], light: ['lighting', 'light'],
      decor: ['decor', 'plant'], plant: ['decor', 'plant'], equipment: ['media', 'equipment', 'screen', 'sign']
    };
    return new Set([category, ...(aliases[category] || [])]);
  }

  function matchSuggestedAsset(suggestion, catalog = []) {
    if (!suggestion || suggestion.renderOnly) return null;
    const aliases = categoryAliases(suggestion.category);
    const wanted = normalizeDimensions(suggestion.dimensions);
    const candidates = catalog.filter(item => item && item.catalogId && item.size);
    let best = null;
    candidates.forEach(item => {
      const terms = [item.category, item.type, item.name].map(value => text(value).toLowerCase());
      const categoryScore = terms.some(term => aliases.has(term)) ? 0 :
        terms.some(term => [...aliases].some(alias => alias && term.includes(alias))) ? .35 : 1.4;
      const size = normalizeDimensions(item.size);
      const sizeScore = ['w', 'd', 'h'].reduce((sum, key) => sum + Math.abs(size[key] - wanted[key]) / Math.max(size[key], wanted[key], .01), 0) / 3;
      const score = categoryScore + sizeScore;
      if (!best || score < best.score) best = { catalogId: item.catalogId, score, item };
    });
    return best && best.score <= 1.85 ? best : null;
  }

  function buildConceptPrompt(context = {}) {
    const booth = context.booth || {};
    const business = text(context.business, 'ธุรกิจทั่วไป');
    const style = text(context.style, 'Modern Minimalist');
    const primary = text(context.primary, '#F72585').toUpperCase();
    const secondary = text(context.secondary, '#111318').toUpperCase();
    const storage = context.hasStorage ? 'มีห้องเก็บของมาตรฐาน' : 'ไม่มีห้องเก็บของ';
    const floor = text(context.floor, 'ไม่ยกพื้น · พรมสีเทาดำ');
    return [
      'AI RENDER INTENT — CONCEPT DESIGN',
      'สร้างภาพแนวคิดบูธที่เปิดใช้งานจริงโดยไม่ใช้ Clean Screenshot เป็นภาพอ้างอิง',
      `ประเภทธุรกิจ: ${business}`,
      `สีแบรนด์: สีหลัก ${primary} · สีรอง ${secondary}`,
      `รูปแบบบูธ: ${text(booth.type, 'Inline')} · ขนาดกว้าง ${number(booth.width, 6).toFixed(2)} ม. × ลึก ${number(booth.depth, 3).toFixed(2)} ม. × สูง ${number(booth.height, 2.4).toFixed(2)} ม.`,
      `ข้อกำหนดตั้งต้น: ${floor} · ${storage}`,
      `สไตล์: ${style}`,
      '',
      'GEOMETRY FIDELITY — CONCEPT',
      'รักษาประเภทธุรกิจ สีแบรนด์ รูปแบบบูธ จำนวนด้านเปิด และขนาดรวมที่กำหนด แต่สามารถเสนอการแบ่งโซน เฟอร์นิเจอร์ลอยตัว แท่นสินค้า สินค้า Generic คน ต้นไม้ พร็อพ แสง และบรรยากาศได้อย่างสร้างสรรค์',
      'Auto-Staging Freedom: สูง · ห้ามใช้แบรนด์จริงหรือเครื่องหมายการค้าที่ลูกค้าไม่ได้ให้มา · ห้ามวางของขวางทางเข้าและทางเดินหลัก',
      '',
      'OUTPUT CONTRACT',
      'ส่งผลลัพธ์ 2 ส่วน: (1) ภาพ Concept แบบ Photorealistic (2) Scene Proposal JSON',
      'Scene Proposal JSON ต้องมี summary, zones และ suggestedAssets; suggestedAssets แต่ละรายการต้องมี id, name, category, dimensions {w,d,h}, position {x,y,z}, rotationY, reason และ renderOnly',
      'คน สินค้า และพร็อพที่ไม่มีโมเดล 3D ให้ตั้ง renderOnly=true และใช้เป็น Render Staging เท่านั้น',
      'รายการทั้งหมดเป็นเพียง AI Suggested ห้ามถือว่าเพิ่มเข้า Project หรือ BOQ จนกว่าผู้ใช้จะยืนยัน'
    ].join('\n');
  }

  global.YPAIRenderIntent = Object.freeze({
    INTENTS, QUALITY, normalizeIntent, normalizeQuality, normalizeSuggestedAsset,
    normalizeSceneProposal, matchSuggestedAsset, buildConceptPrompt
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);

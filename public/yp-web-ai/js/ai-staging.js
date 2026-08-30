(function initAIStagingContext(global) {
  'use strict';

  const AI_STAGING_STATUS = 'AI Suggested / Render Staging';
  const AI_STAGING_DENSITIES = Object.freeze({
    low: Object.freeze({ key: 'low', label: 'น้อย', prompt: 'จัดองค์ประกอบเท่าที่จำเป็นและรักษาพื้นที่ว่างมาก' }),
    medium: Object.freeze({ key: 'medium', label: 'ปานกลาง', prompt: 'จัดองค์ประกอบสมดุล เห็นการใช้งานจริง และยังมีทางเดินโล่ง' }),
    high: Object.freeze({ key: 'high', label: 'มาก', prompt: 'จัดองค์ประกอบค่อนข้างครบ แต่ต้องไม่แน่นหรือกีดขวางทางเดิน' })
  });

  const DEFAULT_AI_STAGING = Object.freeze({
    enabled: true,
    density: 'medium',
    allowFurniture: true,
    allowProducts: true,
    allowPeople: true,
    allowDecor: true,
    allowPlants: true,
    allowNewPermanentStructures: false
  });

  const booleanOrDefault = (value, fallback) => typeof value === 'boolean' ? value : fallback;
  const clampInteger = (value, fallback, min = 0, max = 10) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(min, Math.min(max, Math.round(numeric))) : fallback;
  };

  function normalizeAIStaging(value = {}) {
    const source = value && typeof value === 'object' ? value : {};
    const density = Object.prototype.hasOwnProperty.call(AI_STAGING_DENSITIES, source.density)
      ? source.density
      : DEFAULT_AI_STAGING.density;
    const suggestions = Array.isArray(source.suggestions) ? source.suggestions.map((item, index) => ({
      ...(item && typeof item === 'object' ? item : {}),
      id: String(item?.id || `ai-staging-${index + 1}`),
      status: AI_STAGING_STATUS,
      confirmed: false,
      countsAsSelectedAsset: false,
      includedInBOQ: false,
      includedInProductionScope: false,
      includedInConfirmedGeometry: false
    })) : [];
    return {
      enabled: booleanOrDefault(source.enabled, DEFAULT_AI_STAGING.enabled),
      density,
      allowFurniture: booleanOrDefault(source.allowFurniture, DEFAULT_AI_STAGING.allowFurniture),
      allowProducts: booleanOrDefault(source.allowProducts, DEFAULT_AI_STAGING.allowProducts),
      allowPeople: booleanOrDefault(source.allowPeople, DEFAULT_AI_STAGING.allowPeople),
      allowDecor: booleanOrDefault(source.allowDecor, DEFAULT_AI_STAGING.allowDecor),
      allowPlants: booleanOrDefault(source.allowPlants, DEFAULT_AI_STAGING.allowPlants),
      /* Permanent structures are never unlocked by normalization or UI state. */
      allowNewPermanentStructures: false,
      statusLabel: AI_STAGING_STATUS,
      suggestions
    };
  }

  function normalizeAIRenderFreedom(value = {}) {
    return {
      /* Geometry from the Web Sketch is authoritative and cannot be relaxed. */
      geometryFidelity: 10,
      stagingFreedom: clampInteger(value.stagingFreedom, 6)
    };
  }

  function allowedStagingLabels(settings) {
    const state = normalizeAIStaging(settings);
    const labels = [];
    if (state.allowFurniture) labels.push('เฟอร์นิเจอร์ลอยตัวและชั้น/แท่นวางสินค้า');
    if (state.allowProducts) labels.push('สินค้าตัวอย่างและอุปกรณ์สาธิตแบบ Generic');
    if (state.allowPeople) labels.push('พนักงานและผู้เข้าชมงาน');
    if (state.allowDecor) labels.push('พร็อพและของตกแต่ง');
    if (state.allowPlants) labels.push('ต้นไม้');
    return labels;
  }

  function buildAutoStagingPromptLines(options = {}) {
    const state = normalizeAIStaging(options.settings);
    const freedom = normalizeAIRenderFreedom(options);
    const selectedAssetCount = Math.max(0, Number(options.selectedAssetCount) || 0);
    const density = AI_STAGING_DENSITIES[state.density];
    const business = String(options.business || 'ไม่ระบุ');
    const brandColor = String(options.brandColor || 'ไม่ระบุ').toUpperCase();
    const renderStyle = String(options.renderStyle || 'ไม่ระบุ');
    const categorySuggestions = Array.isArray(options.categorySuggestions)
      ? options.categorySuggestions.map(item => String(item || '').trim()).filter(Boolean)
      : [];

    if (!state.enabled) {
      return [
        'LAYER B — AI AUTO-STAGING',
        'สถานะ: ปิด — แสดงเฉพาะองค์ประกอบที่อยู่ในแบบ 3D และห้ามเติมเฟอร์นิเจอร์ สินค้า คน พร็อพ หรือต้นไม้ใหม่',
        `Geometry Fidelity: ${freedom.geometryFidelity}/10 · ต้องรักษา Geometry จากระบบ 3D`,
        'ห้ามเพิ่มหรือสร้างพื้น ผนัง ห้อง ช่องเปิด หรือโครงสร้างถาวรใหม่'
      ];
    }

    const allowed = allowedStagingLabels(state);
    const lines = [
      'LAYER B — AI AUTO-STAGING',
      `สถานะ: เปิด · ระดับองค์ประกอบ ${density.label} · Staging Freedom ${freedom.stagingFreedom}/10`,
      `แนวทางความหนาแน่น: ${density.prompt}`,
      `ใช้หมวดธุรกิจ “${business}” สีแบรนด์ ${brandColor} และสไตล์ “${renderStyle}” เพื่อเลือกองค์ประกอบเสริมให้เหมาะสม`,
      allowed.length ? `อนุญาตให้เพิ่ม: ${allowed.join(' · ')}` : 'ไม่อนุญาตหมวดองค์ประกอบเสริมใดในขณะนี้'
    ];
    if (selectedAssetCount === 0) {
      lines.push('ไม่มีอุปกรณ์ที่ลูกค้าเลือกไม่ได้หมายความว่าต้องสร้างบูธเปล่า ให้เปิด Auto-Staging และเติมองค์ประกอบที่ได้รับอนุญาตเพื่อสื่อการใช้งานจริง');
    } else {
      lines.push(`มีอุปกรณ์ที่ลูกค้าเลือก ${selectedAssetCount} ชิ้น ต้องคงไว้ทั้งหมด แล้วเติมเฉพาะหมวดองค์ประกอบที่ยังขาดโดยห้ามชนหรือซ้อนกับอุปกรณ์เดิม`);
    }
    if (categorySuggestions.length) lines.push('ข้อเสนอแนะตามหมวดธุรกิจ: ' + categorySuggestions.join(' · '));
    lines.push(
      'กฎการจัดวาง Auto-Staging: ต้องอยู่ภายในพื้นที่บูธ มีสัดส่วนสมจริง ไม่ทับผนัง โลโก้ ห้องเก็บของ หรืออุปกรณ์เดิม ไม่ขวางประตูห้องเก็บของ ทางเข้า และทางเดินหลัก',
      'ห้ามสร้างพื้น ผนัง ห้อง ช่องเปิด หรือโครงสร้างถาวรใหม่ และห้ามเปลี่ยน Geometry ที่มาจากระบบ 3D',
      'ใช้สินค้าและกราฟิกแบบ Generic เท่านั้น ห้ามใช้แบรนด์หรือเครื่องหมายการค้าจริงหากลูกค้าไม่ได้อัปโหลด',
      `องค์ประกอบที่ AI เติมทุกชิ้นต้องติดสถานะ “${AI_STAGING_STATUS}” และเป็นเพียงองค์ประกอบประกอบภาพ`,
      'AI Suggested ห้ามนับเป็นอุปกรณ์ที่ลูกค้าเลือก รายการ BOQ สโคปการผลิต หรือ Geometry ที่ยืนยันแล้ว จนกว่าผู้ใช้จะยืนยันองค์ประกอบนั้น'
    );
    return lines;
  }

  global.YPAIStaging = Object.freeze({
    AI_STAGING_STATUS,
    AI_STAGING_DENSITIES,
    DEFAULT_AI_STAGING,
    normalizeAIStaging,
    normalizeAIRenderFreedom,
    allowedStagingLabels,
    buildAutoStagingPromptLines
  });
})(typeof window !== 'undefined' ? window : globalThis);

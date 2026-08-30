(function initQuickSetupContext(global) {
  'use strict';

  const BUSINESS_DESIGN_CONTEXTS = Object.freeze({
    food: {
      themeKeywords: ['น่ารับประทาน', 'เข้าถึงง่าย', 'อบอุ่นและสะอาด'],
      suggestedElements: ['เคาน์เตอร์ชิมสินค้า', 'ชั้นโชว์บรรจุภัณฑ์'],
      decorSuggestions: ['ภาพสินค้าและวัตถุดิบแบบ Generic'],
      productDisplaySuggestions: ['จัดสินค้าให้หยิบชมง่ายและเห็นฉลากชัด'],
      graphicSuggestions: ['กราฟิกสื่อรสชาติและคุณภาพสินค้า'],
      materialSuggestions: ['ไม้โทนอุ่น', 'พื้นผิวที่ดูสะอาด'],
      lightingSuggestions: ['แสงอบอุ่นที่ทำให้อาหารดูน่าสนใจ']
    },
    fash: {
      themeKeywords: ['ร่วมสมัย', 'โดดเด่น', 'เหมาะกับการถ่ายภาพ'],
      suggestedElements: ['ราวหรือแท่นจัดแสดงสินค้า', 'กระจกเต็มตัว'],
      decorSuggestions: ['จุดจัดวางลุคเด่นประจำคอลเลกชัน'],
      productDisplaySuggestions: ['เว้นระยะสินค้าให้เห็นทรงและรายละเอียดชัด'],
      graphicSuggestions: ['กราฟิกแนว Editorial ที่ไม่สร้างแบรนด์ใหม่'],
      materialSuggestions: ['โลหะพ่นสี', 'ผิวด้านร่วมสมัย'],
      lightingSuggestions: ['แสงเน้นสินค้าและสีของเนื้อผ้า']
    },
    beau: {
      themeKeywords: ['สะอาด', 'พรีเมียม', 'นุ่มนวล'],
      suggestedElements: ['ชั้นโชว์แบบมีไฟ', 'พื้นที่ทดลองสินค้า', 'กระจก'],
      decorSuggestions: ['องค์ประกอบทรงโค้งและรายละเอียดที่ดูประณีต'],
      productDisplaySuggestions: ['จัดสินค้าตามกลุ่มการใช้งานและระดับสายตา'],
      graphicSuggestions: ['กราฟิกสะอาดที่เน้นคุณสมบัติสินค้า'],
      materialSuggestions: ['ผิวเงาบางส่วน', 'อะคริลิกใส', 'โลหะสีอ่อน'],
      lightingSuggestions: ['แสงนุ่มที่ถ่ายทอดสีผิวและสีผลิตภัณฑ์ได้ดี']
    },
    jewe: {
      themeKeywords: ['หรูหรา', 'ละเอียด', 'ปลอดภัย'],
      suggestedElements: ['ตู้โชว์กระจก', 'แท่นโชว์ระดับสายตา'],
      decorSuggestions: ['ฉากหลังเรียบเพื่อขับชิ้นงาน'],
      productDisplaySuggestions: ['แยกชิ้นเด่นและเว้นพื้นที่ว่างรอบสินค้า'],
      graphicSuggestions: ['กราฟิกน้อยชิ้นและตัวอักษรประณีต'],
      materialSuggestions: ['กระจก', 'โลหะพรีเมียม', 'ผิวกำมะหยี่'],
      lightingSuggestions: ['แสง Accent ที่ช่วยให้ชิ้นงานเกิดประกาย']
    },
    home: {
      themeKeywords: ['เป็นธรรมชาติ', 'อบอุ่น', 'ใช้งานจริง'],
      suggestedElements: ['พื้นที่จำลองการใช้งาน', 'ชั้นจัดแสดงตัวอย่างวัสดุ'],
      decorSuggestions: ['ต้นไม้หรือของตกแต่ง Generic อย่างพอดี'],
      productDisplaySuggestions: ['จัดกลุ่มสินค้าตามพื้นที่ใช้งาน'],
      graphicSuggestions: ['ภาพบรรยากาศบ้านและข้อมูลคุณสมบัติ'],
      materialSuggestions: ['ไม้', 'ผ้าทอ', 'วัสดุธรรมชาติ'],
      lightingSuggestions: ['แสงอบอุ่นแบบที่อยู่อาศัย']
    },
    furn: {
      themeKeywords: ['เป็นสัดส่วน', 'สบายตา', 'สื่อสเกลจริง'],
      suggestedElements: ['พื้นที่ทดลองใช้งาน', 'จุดแสดงวัสดุและสี'],
      decorSuggestions: ['ฉากจัดวางแบบห้องตัวอย่าง'],
      productDisplaySuggestions: ['เว้นทางเดินและระยะมองเฟอร์นิเจอร์ให้ชัด'],
      graphicSuggestions: ['กราฟิกอธิบายฟังก์ชันและขนาด'],
      materialSuggestions: ['ไม้', 'โลหะ', 'ผ้าบุ'],
      lightingSuggestions: ['แสง Ambient ร่วมกับแสงเน้นรูปทรง']
    },
    appl: {
      themeKeywords: ['ทันสมัย', 'เป็นระเบียบ', 'ทดลองใช้งานได้'],
      suggestedElements: ['Demo station', 'ชั้นจัดแสดงพร้อมระบบไฟ'],
      decorSuggestions: ['เส้นสายเรขาคณิตที่สื่อความแม่นยำ'],
      productDisplaySuggestions: ['เว้นพื้นที่สาธิตและจุดเชื่อมต่ออุปกรณ์'],
      graphicSuggestions: ['กราฟิกสรุปฟังก์ชันและประโยชน์ใช้งาน'],
      materialSuggestions: ['โลหะพ่นสี', 'อะคริลิก', 'ผิวด้านสะอาด'],
      lightingSuggestions: ['แสงขาวที่แสดงสีและรายละเอียดผลิตภัณฑ์ชัด']
    },
    baby: {
      themeKeywords: ['อ่อนโยน', 'ปลอดภัย', 'เป็นมิตร'],
      suggestedElements: ['ชั้นโชว์ขอบมน', 'พื้นที่ให้ผู้ปกครองทดลองสินค้า'],
      decorSuggestions: ['รูปทรงโค้งและสีสบายตา'],
      productDisplaySuggestions: ['วางสินค้าในระดับหยิบง่ายและไม่กีดขวาง'],
      graphicSuggestions: ['กราฟิกเรียบง่ายที่สื่อความปลอดภัย'],
      materialSuggestions: ['ไม้สีอ่อน', 'ผิวสัมผัสนุ่ม', 'วัสดุทำความสะอาดง่าย'],
      lightingSuggestions: ['แสงนุ่มสม่ำเสมอ ไม่แยงตา']
    },
    heal: {
      themeKeywords: ['สะอาด', 'น่าเชื่อถือ', 'สงบ'],
      suggestedElements: ['จุดให้ข้อมูล', 'พื้นที่ให้คำปรึกษา'],
      decorSuggestions: ['องค์ประกอบเรียบง่ายที่สร้างความมั่นใจ'],
      productDisplaySuggestions: ['แยกข้อมูลและผลิตภัณฑ์เป็นหมวดชัดเจน'],
      graphicSuggestions: ['กราฟิกข้อมูลที่อ่านง่ายและไม่กล่าวอ้างเกินจริง'],
      materialSuggestions: ['ผิวสีอ่อน', 'วัสดุทำความสะอาดง่าย'],
      lightingSuggestions: ['แสงขาวนุ่มที่ให้ความรู้สึกสะอาด']
    },
    pet: {
      themeKeywords: ['เป็นมิตร', 'สนุก', 'ดูแลใส่ใจ'],
      suggestedElements: ['ชั้นโชว์ตามประเภทสัตว์เลี้ยง', 'พื้นที่สาธิตสินค้า'],
      decorSuggestions: ['องค์ประกอบธรรมชาติและรูปทรงเป็นมิตร'],
      productDisplaySuggestions: ['จัดสินค้าตามการใช้งานและขนาดสัตว์เลี้ยง'],
      graphicSuggestions: ['ภาพสัตว์เลี้ยงแบบ Generic และข้อมูลที่อ่านง่าย'],
      materialSuggestions: ['ไม้', 'พื้นผิวทนทาน', 'วัสดุทำความสะอาดง่าย'],
      lightingSuggestions: ['แสงสว่างสดใสและเป็นธรรมชาติ']
    },
    spor: {
      themeKeywords: ['กระฉับกระเฉง', 'แข็งแรง', 'มีพลัง'],
      suggestedElements: ['พื้นที่สาธิต', 'แท่นโชว์สินค้าฮีโร่'],
      decorSuggestions: ['เส้นกราฟิกที่สื่อการเคลื่อนไหว'],
      productDisplaySuggestions: ['จัดสินค้าให้เห็นรูปทรงและเทคโนโลยีชัด'],
      graphicSuggestions: ['กราฟิกขนาดใหญ่และข้อมูลสมรรถนะ'],
      materialSuggestions: ['ยาง', 'โลหะ', 'พื้นผิวทนทาน'],
      lightingSuggestions: ['แสง Contrast ชัดและแสงเน้นจุดเด่น']
    },
    trav: {
      themeKeywords: ['ชวนค้นหา', 'โปร่ง', 'เป็นมิตร'],
      suggestedElements: ['จุดให้ข้อมูล', 'พื้นที่สนทนา', 'จอแสดงภาพปลายทาง'],
      decorSuggestions: ['องค์ประกอบที่สื่อบรรยากาศสถานที่แบบ Generic'],
      productDisplaySuggestions: ['จัดแผนที่หรือแพ็กเกจให้เปรียบเทียบง่าย'],
      graphicSuggestions: ['ภาพบรรยากาศและข้อมูลเส้นทางที่อ่านชัด'],
      materialSuggestions: ['ไม้', 'ผ้าทอ', 'วัสดุธรรมชาติร่วมสมัย'],
      lightingSuggestions: ['แสงสว่างอบอุ่นที่ชวนให้เข้าพูดคุย']
    },
    tech: {
      themeKeywords: ['ล้ำสมัย', 'แม่นยำ', 'Interactive'],
      suggestedElements: ['Demo station', 'Display screen', 'Interactive zone'],
      decorSuggestions: ['เส้นแสงและรูปทรงดิจิทัล'],
      productDisplaySuggestions: ['จัดพื้นที่ทดลองโดยมีทางเดินและสายสัญญาณเป็นระเบียบ'],
      graphicSuggestions: ['กราฟิกข้อมูลเทคโนโลยีแบบอ่านง่าย'],
      materialSuggestions: ['โลหะ', 'กระจก', 'อะคริลิก', 'ผิวด้านสีเข้ม'],
      lightingSuggestions: ['แสงขาวคมและ Accent light ที่ควบคุมได้']
    },
    auto: {
      themeKeywords: ['สมรรถนะสูง', 'พรีเมียม', 'แข็งแรง'],
      suggestedElements: ['พื้นที่แสดงชิ้นส่วนหรือเทคโนโลยี', 'จอข้อมูล'],
      decorSuggestions: ['เส้นสายที่สื่อความเร็วและวิศวกรรม'],
      productDisplaySuggestions: ['เว้นพื้นที่รอบวัตถุหลักให้ชมได้หลายมุม'],
      graphicSuggestions: ['กราฟิกสมรรถนะและรายละเอียดเชิงเทคนิค'],
      materialSuggestions: ['โลหะ', 'ผิวคาร์บอน', 'ยาง', 'ผิวเงาพรีเมียม'],
      lightingSuggestions: ['แสงเน้นรูปทรงและ Reflection ที่ควบคุมได้']
    },
    cons: {
      themeKeywords: ['แข็งแรง', 'จริงจัง', 'แสดงวัสดุจริง'],
      suggestedElements: ['ผนังตัวอย่างวัสดุ', 'โต๊ะให้คำปรึกษา'],
      decorSuggestions: ['รายละเอียดการประกอบที่ดูผลิตได้จริง'],
      productDisplaySuggestions: ['จัดตัวอย่างวัสดุตามระบบหรือการใช้งาน'],
      graphicSuggestions: ['ไดอะแกรมและข้อมูลสเปกที่อ่านง่าย'],
      materialSuggestions: ['คอนกรีต', 'ไม้', 'โลหะ', 'วัสดุเปลือย'],
      lightingSuggestions: ['แสงขาวเป็นกลางที่แสดงพื้นผิววัสดุชัด']
    },
    indu: {
      themeKeywords: ['เป็นระบบ', 'ทนทาน', 'เชิงวิศวกรรม'],
      suggestedElements: ['พื้นที่สาธิตเครื่องจักร', 'จุดแสดงชิ้นส่วน', 'จอข้อมูล'],
      decorSuggestions: ['โครงสร้างเปิดเผยที่สื่อกระบวนการทำงาน'],
      productDisplaySuggestions: ['จัดระยะปลอดภัยและเส้นทางชมงานชัดเจน'],
      graphicSuggestions: ['กราฟิก Flow และข้อมูลประสิทธิภาพ'],
      materialSuggestions: ['โลหะพ่นสี', 'ตะแกรง', 'พื้นผิวอุตสาหกรรม'],
      lightingSuggestions: ['แสงสว่างสม่ำเสมอและแสงเน้นเครื่องจักร']
    },
    other: {
      themeKeywords: ['เหมาะกับสินค้า', 'เข้าถึงง่าย', 'สอดคล้องกับกลุ่มลูกค้า'],
      suggestedElements: ['จุดให้ข้อมูล', 'พื้นที่นำเสนอสินค้าแบบ Generic'],
      decorSuggestions: ['องค์ประกอบที่เสริมบรรยากาศโดยไม่สร้างแบรนด์ใหม่'],
      productDisplaySuggestions: ['จัดลำดับจุดเด่นตามสิ่งที่ลูกค้าให้ข้อมูล'],
      graphicSuggestions: ['กราฟิกอธิบายสินค้าอย่างตรงไปตรงมา'],
      materialSuggestions: ['วัสดุที่ผลิตได้จริงและดูแลรักษาง่าย'],
      lightingSuggestions: ['แสงสมดุลที่เน้นองค์ประกอบหลัก']
    }
  });

  /* Wizard labels follow the common depth × width wording used by customers,
     while the scene keeps its established W (left-to-right) / D (back-to-front)
     axes. This prevents a 3 × 6 booth from being rotated in the 3D workspace. */
  const QUICK_SETUP_BOOTH_DEFAULTS = Object.freeze({
    inline: Object.freeze({ width: 6, depth: 3, height: 2.4, displaySize: '3 × 6 ม.', openSides: 1 }),
    corner: Object.freeze({ width: 6, depth: 3, height: 2.4, displaySize: '3 × 6 ม.', openSides: 2 }),
    penin: Object.freeze({ width: 6, depth: 6, height: 2.4, displaySize: '6 × 6 ม.', openSides: 3 }),
    island: Object.freeze({ width: 6, depth: 6, height: 2.4, displaySize: '6 × 6 ม.', openSides: 4 })
  });

  function boothDefaultsFor(type) {
    const preset = QUICK_SETUP_BOOTH_DEFAULTS[type];
    return preset ? { ...preset } : null;
  }

  function normalizeHexColor(value, fallback = '#2E7D4F') {
    const raw = String(value || '').trim();
    const withHash = raw.startsWith('#') ? raw : '#' + raw;
    return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toUpperCase() : fallback;
  }

  const normalizeSuggestion = value => String(value || '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  const isDuplicateSuggestion = (candidate, accepted) => {
    const next = normalizeSuggestion(candidate);
    if (!next) return true;
    return accepted.some(value => {
      const current = normalizeSuggestion(value);
      return current === next || (current.length > 3 && next.length > 3 && (current.includes(next) || next.includes(current)));
    });
  };

  function mergeSuggestionLayers(userChoice = [], categorySuggestion = [], genericDefault = []) {
    const merged = [];
    [userChoice, categorySuggestion, genericDefault].forEach(layer => {
      (Array.isArray(layer) ? layer : []).forEach(value => {
        const clean = String(value || '').trim();
        if (clean && !isDuplicateSuggestion(clean, merged)) merged.push(clean);
      });
    });
    return merged;
  }

  function contextForCategory(categoryId) {
    return BUSINESS_DESIGN_CONTEXTS[categoryId] || BUSINESS_DESIGN_CONTEXTS.other;
  }

  function categorySuggestionList(categoryId) {
    const context = contextForCategory(categoryId);
    return mergeSuggestionLayers([], [
      ...(context.suggestedElements || []),
      ...(context.decorSuggestions || []),
      ...(context.productDisplaySuggestions || []),
      ...(context.graphicSuggestions || []),
      ...(context.materialSuggestions || []),
      ...(context.lightingSuggestions || [])
    ], []);
  }

  function categoryPromptLines({ categoryId, categoryLabel, customBusinessCategory, userChoices = [] } = {}) {
    const label = categoryId === 'other' && String(customBusinessCategory || '').trim()
      ? String(customBusinessCategory).trim()
      : String(categoryLabel || '').trim();
    const context = contextForCategory(categoryId);
    const suggestions = mergeSuggestionLayers(userChoices, categorySuggestionList(categoryId), []);
    const userCount = Array.isArray(userChoices) ? userChoices.filter(Boolean).length : 0;
    const categoryOnly = suggestions.slice(userCount);
    return [
      'บริบทหมวดธุรกิจ: ' + (label || 'ไม่ระบุ'),
      'บุคลิกที่เหมาะกับหมวดธุรกิจ: ' + (context.themeKeywords || []).join(', '),
      'คำแนะนำเสริมตามหมวดธุรกิจ (ใช้เฉพาะส่วนที่ลูกค้ายังไม่ได้เลือก และห้ามเขียนทับ Geometry/วัสดุ/องค์ประกอบเดิม): ' + (categoryOnly.join(', ') || 'ไม่มีคำแนะนำเพิ่มเติม')
    ];
  }

  global.YPQuickSetupContext = Object.freeze({
    BUSINESS_DESIGN_CONTEXTS,
    QUICK_SETUP_BOOTH_DEFAULTS,
    boothDefaultsFor,
    normalizeHexColor,
    contextForCategory,
    categorySuggestionList,
    categoryPromptLines,
    mergeSuggestionLayers
  });
})(typeof window !== 'undefined' ? window : globalThis);

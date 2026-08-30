(function initAIRenderPipeline(global) {
  'use strict';

  const PIPELINE_STAGES = Object.freeze([
    'buildPrompt',
    'prepareReferenceImage',
    'uploadReferenceImage',
    'sendRenderRequest',
    'waitForModel',
    'downloadResult',
    'displayResult'
  ]);

  const STATUS_LABELS = Object.freeze({
    preparing: 'กำลังเตรียมข้อมูล',
    uploading: 'กำลังอัปโหลดแบบ 3D',
    generating: 'AI กำลังสร้างภาพ',
    displaying: 'กำลังแสดงผล',
    complete: 'สร้างภาพเสร็จแล้ว',
    error: 'สร้างภาพไม่สำเร็จ'
  });

  const clockNow = () => global.performance?.now?.() ?? Date.now();
  const clampInteger = (value, fallback, min, max) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(min, Math.min(max, Math.round(numeric))) : fallback;
  };
  const createId = (prefix = 'render') => {
    const id = global.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${id}`;
  };
  const errorWithCode = (message, code) => Object.assign(new Error(message), { code });

  function referenceImageMeta(reference = {}, limits = {}) {
    const width = Math.max(0, Math.round(Number(reference.width) || 0));
    const height = Math.max(0, Math.round(Number(reference.height) || 0));
    const bytes = Math.max(0, Math.round(Number(reference.blob?.size ?? reference.bytes) || 0));
    const aspect = width && height ? width / height : 0;
    const longEdge = Math.max(width, height);
    const maxBytes = Math.max(1, Number(limits.maxBytes) || 4 * 1024 * 1024);
    const minLongEdge = Math.max(1, Number(limits.minLongEdge) || 1536);
    const maxLongEdge = Math.max(minLongEdge, Number(limits.maxLongEdge) || 2048);
    const expectedAspect = Number(limits.expectedAspect) || 0;
    const aspectTolerance = Math.max(0.0001, Number(limits.aspectTolerance) || 0.005);
    return {
      width, height, bytes, aspect, longEdge, maxBytes, minLongEdge, maxLongEdge,
      aspectMatches: !expectedAspect || Math.abs(aspect - expectedAspect) <= aspectTolerance,
      withinByteLimit: !bytes || bytes <= maxBytes,
      withinResolutionLimit: longEdge >= minLongEdge && longEdge <= maxLongEdge
    };
  }

  function validateReferenceImage(reference, limits = {}) {
    const meta = referenceImageMeta(reference, limits);
    if (!reference?.blob) throw errorWithCode('ไม่พบไฟล์ Clean Screenshot สำหรับส่ง Render', 'REFERENCE_IMAGE_MISSING');
    if (!meta.width || !meta.height) throw errorWithCode('Clean Screenshot ไม่มีข้อมูลขนาดภาพ', 'REFERENCE_DIMENSIONS_MISSING');
    if (!meta.aspectMatches) throw errorWithCode('Aspect Ratio ของ Clean Screenshot ไม่ตรงกับ Viewport', 'REFERENCE_ASPECT_MISMATCH');
    if (!meta.withinResolutionLimit) throw errorWithCode(`Clean Screenshot ต้องมีด้านยาว ${meta.minLongEdge}–${meta.maxLongEdge} px`, 'REFERENCE_RESOLUTION_OUT_OF_RANGE');
    if (!meta.withinByteLimit) throw errorWithCode(`Clean Screenshot มีขนาดเกิน ${(meta.maxBytes / 1024 / 1024).toFixed(1)} MB`, 'REFERENCE_IMAGE_TOO_LARGE');
    return meta;
  }

  function withTimeout(promise, timeoutMs, code) {
    const duration = Math.max(1000, Number(timeoutMs) || 180000);
    let timer = 0;
    return Promise.race([
      Promise.resolve(promise).finally(() => timer && clearTimeout(timer)),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(errorWithCode(`AI Render เกินเวลาที่กำหนด ${Math.round(duration / 1000)} วินาที`, code)), duration);
      })
    ]);
  }

  class AIRenderPipeline {
    constructor(options = {}) {
      this.adapter = options.adapter || null;
      this.development = options.development === true;
      this.onStatus = typeof options.onStatus === 'function' ? options.onStatus : null;
      this.active = null;
      this.lastReport = null;
      this.maxPollAttempts = clampInteger(options.maxPollAttempts, 120, 1, 300);
      this.waitTimeoutMs = Math.max(10000, Number(options.waitTimeoutMs) || 180000);
    }

    configure(adapter) {
      this.adapter = adapter && typeof adapter === 'object' ? adapter : null;
      return this.ready();
    }

    ready() {
      return typeof this.adapter?.sendRenderRequest === 'function';
    }

    status(status, requestId, detail = '') {
      const payload = { status, label: STATUS_LABELS[status] || status, requestId, detail };
      this.onStatus?.(payload);
      return payload;
    }

    run(input = {}) {
      if (this.active?.promise) {
        if (this.development) console.warn('[AI Render] Duplicate submit ignored', { requestId: this.active.requestId });
        return this.active.promise;
      }
      const requestId = String(input.requestId || createId('render'));
      const promise = this.execute({ ...input, requestId }).finally(() => {
        if (this.active?.requestId === requestId) this.active = null;
      });
      this.active = { requestId, promise, startedAt: Date.now() };
      return promise;
    }

    async execute(input) {
      if (!this.ready()) throw errorWithCode('ยังไม่ได้เชื่อมต่อ AI Render Adapter', 'AI_RENDER_ADAPTER_MISSING');
      const requestId = input.requestId;
      const timings = {};
      const context = {
        requestId,
        abTestId: input.abTestId || null,
        promptVariant: input.promptVariant === 'compact' ? 'compact' : 'full',
        model: input.model || this.adapter.model || null,
        quality: input.quality || this.adapter.quality || null,
        size: input.size || this.adapter.size || null,
        maxPollAttempts: this.maxPollAttempts
      };
      const measure = async (name, task) => {
        const started = clockNow();
        try { return await task(); }
        finally { timings[name] = Math.max(0, clockNow() - started); }
      };
      try {
        this.status('preparing', requestId);
        const prompt = await measure('buildPrompt', () => input.buildPrompt(context));
        const reference = await measure('prepareReferenceImage', () => input.referenceImage || input.prepareReferenceImage(context));
        const referenceMeta = validateReferenceImage(reference, input.referenceLimits);

        this.status('uploading', requestId, `${referenceMeta.width} × ${referenceMeta.height} px · ${(referenceMeta.bytes / 1024).toFixed(0)} KB`);
        const uploadedReference = await measure('uploadReferenceImage', () => this.adapter.uploadReferenceImage
          ? this.adapter.uploadReferenceImage(reference, context)
          : reference);

        this.status('generating', requestId);
        let sentRequests = 0;
        const renderRequest = await measure('sendRenderRequest', () => {
          sentRequests += 1;
          if (sentRequests > 1) throw errorWithCode('ตรวจพบ Render Request ซ้ำในคำสั่งเดียวกัน', 'DUPLICATE_RENDER_REQUEST');
          return this.adapter.sendRenderRequest({ prompt, reference: uploadedReference, ...context });
        });
        const modelResult = await measure('waitForModel', () => this.adapter.waitForModel
          ? withTimeout(this.adapter.waitForModel(renderRequest, context), this.waitTimeoutMs, 'MODEL_WAIT_TIMEOUT')
          : renderRequest);

        this.status('displaying', requestId);
        const downloadedResult = await measure('downloadResult', () => this.adapter.downloadResult
          ? this.adapter.downloadResult(modelResult, context)
          : modelResult);
        const displayedResult = await measure('displayResult', () => this.adapter.displayResult
          ? this.adapter.displayResult(downloadedResult, context)
          : downloadedResult);

        const report = {
          requestId,
          abTestId: context.abTestId,
          promptVariant: context.promptVariant,
          promptCharacters: String(prompt || '').length,
          reference: referenceMeta,
          sentRequests,
          timings,
          totalMs: PIPELINE_STAGES.reduce((sum, stage) => sum + (Number(timings[stage]) || 0), 0),
          result: displayedResult
        };
        this.lastReport = report;
        this.status('complete', requestId);
        if (this.development) {
          console.groupCollapsed(`[AI Render] ${requestId} · ${context.promptVariant}`);
          console.table(PIPELINE_STAGES.map(stage => ({ stage, ms: Number((timings[stage] || 0).toFixed(2)) })));
          console.info('Request summary', { sentRequests, promptCharacters: report.promptCharacters, reference: referenceMeta, totalMs: report.totalMs });
          console.groupEnd();
        }
        return report;
      } catch (error) {
        this.status('error', requestId, error?.message || String(error));
        if (this.development) console.error('[AI Render] Pipeline failed', { requestId, error, timings });
        throw error;
      }
    }

    async runABTest(input = {}) {
      if (!this.ready()) throw errorWithCode('A/B Test ต้องเชื่อมต่อ AI Render Adapter ก่อน', 'AI_RENDER_ADAPTER_MISSING');
      if (this.active) throw errorWithCode('มี AI Render ที่กำลังทำงานอยู่', 'AI_RENDER_BUSY');
      const abTestId = String(input.abTestId || createId('ab'));
      const prepareStarted = clockNow();
      const referenceImage = await input.prepareReferenceImage({ requestId: abTestId, abTestId, promptVariant: 'shared-reference' });
      const sharedPrepareMs = Math.max(0, clockNow() - prepareStarted);
      validateReferenceImage(referenceImage, input.referenceLimits);
      const shared = {
        ...input,
        abTestId,
        referenceImage,
        prepareReferenceImage: undefined
      };
      const full = await this.run({ ...shared, requestId: createId('render-full'), promptVariant: 'full', buildPrompt: input.buildFullPrompt });
      const compact = await this.run({ ...shared, requestId: createId('render-compact'), promptVariant: 'compact', buildPrompt: input.buildCompactPrompt });
      return { abTestId, sharedPrepareMs, full, compact };
    }
  }

  global.YPAIRenderPipeline = Object.freeze({
    PIPELINE_STAGES,
    STATUS_LABELS,
    referenceImageMeta,
    validateReferenceImage,
    create: options => new AIRenderPipeline(options)
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);

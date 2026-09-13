(function(){
 'use strict';if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
 const $=id=>document.getElementById(id),modal=$('mRelease'),stage=modal.querySelector('.quick-setup-stage'),model=YPWizardModel;
 let session=null,preview=null,opener=null,filter='all',selected='blank';
 const labels=['ธุรกิจ','พื้นที่','แบบตั้งต้น','ปรับแต่ง','ตรวจสอบ'];
 const library=type=>({inline:YPInlineTemplates,corner:YPCornerTemplates,penin:YPPeninsularTemplates,island:YPIslandTemplates}[type]);
 const bridge=type=>({inline:YPInlineTemplateBridge,corner:YPCornerTemplateBridge,penin:YPPeninsularTemplateBridge,island:YPIslandTemplateBridge}[type]);
 const template=()=>library(quickSetupDraft.boothType)?.templates.find(t=>t.id===selected);
 const imageFor=t=>'assets/'+({inline:'inline',corner:'corner',penin:'peninsular',island:'island'}[quickSetupDraft.boothType])+'-templates/'+t.id+(quickSetupDraft.boothType==='corner'?'-'+quickSetupDraft.cornerSide:'')+'.png';
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const action=(text,fn,id)=>{const b=node('button',text,'btn');b.type='button';b.onclick=fn;if(id)b.id=id;return b;};
 function panel(key,title,description){
   const n=node('section',null,'quick-setup-step');n.dataset.quickStep=key;n.hidden=true;
   n.innerHTML='<div class="quick-step-scroll"><header class="quick-step-head"><div class="quick-step-kicker">ขั้นตอนที่ '+(model.steps.indexOf(key)+1)+' / 5</div><h2 tabindex="-1" id="wizard-'+key+'-title"></h2><p class="quick-step-description"></p></header><div class="wizard-content"></div></div><div class="quick-step-actions"></div>';
   n.querySelector('h2').textContent=title;n.querySelector('header p').textContent=description;stage.append(n);return n;
 }
 function footer(n,back,next,id,text='ขั้นต่อไป'){
   n.querySelector('.quick-step-actions').replaceChildren(action('ย้อนกลับ',()=>show(back)),action(text,next,id));$(id).classList.add('pri');
 }
 // Reuse the business brief and floor controls; the other steps are explicitly
 // owned by this module so the old template dimension resets cannot run here.
 modal.classList.add('wizard-v2');$('quickSetupDialogLabel').textContent='วิซาร์ดออกแบบบูธ';
 $('quickSetupProgress').replaceChildren(...model.steps.map((key,i)=>{const n=node('div',null,'quick-progress-item');n.dataset.progressStep=key;n.append(node('span',String(i+1),'quick-progress-dot'),node('span',labels[i]));return n;}));
 $('quickBusinessTitle').textContent='ข้อมูลธุรกิจและโจทย์งาน';
 $('quickStepBusiness').querySelector('.quick-step-description').textContent='เลือกหมวดธุรกิจสำหรับคำแนะนำและ Prompt · รายละเอียดเสริมข้ามได้ ไม่ย้ายหรือเพิ่มอุปกรณ์ในแบบ 3D อัตโนมัติ';
 $('quickLayoutTitle').textContent='พื้นที่และรูปแบบบูธ';
 $('quickStepLayout').querySelector('.quick-step-description').textContent='ระบุพื้นที่จริงก่อนเลือกแบบตั้งต้น · กว้างเป็นแนวหน้าบูธ ลึกเป็นแนวหน้า–หลัง';
 $('quickInlineTemplates').hidden=true;
 const area=node('div',null,'wizard-dimensions');
 for(const [key,label,min,max] of [['width','กว้าง',1,30],['depth','ลึก',1,30],['height','สูง',2.4,4.9]]){
   const l=node('label',label+' (ม.)'),i=node('input');i.id='wizard-'+key;i.type='number';i.min=min;i.max=max;i.step='.1';i.inputMode='decimal';i.setAttribute('aria-describedby','quickLayoutError');
   i.oninput=()=>{quickSetupDraft[key]=i.value===''?NaN:Number(i.value);updateArea();};i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();i.blur();}};l.append(i);area.append(l);
 }
 $('quickStepLayout').querySelector('.quick-section').prepend(area);
 const choicesPanel=panel('template','เลือกแบบตั้งต้น','เลือกเทมเพลต หรือบูธเปล่า · ภาพบนการ์ดเป็นขนาดต้นฉบับ พรีวิวขั้นถัดไปใช้พื้นที่ที่คุณกำหนดจริง');
 const choiceHost=choicesPanel.querySelector('.wizard-content');
 const filters=node('div',null,'wizard-filter');
 filters.append(action('ทุกขนาดในรูปแบบนี้',()=>{filter='all';buildTemplates();},'wizard-filter-all'),action('ตรงขนาดพื้นที่',()=>{filter='exact';buildTemplates();},'wizard-filter-exact'));
 const cards=node('div',null,'wizard-template-grid');cards.id='wizard-template-cards';cards.setAttribute('role','group');cards.setAttribute('aria-label','เลือกแบบตั้งต้น');
 const choiceNote=node('p',null,'wizard-note');choiceNote.id='wizard-template-note';choiceNote.setAttribute('role','status');choiceHost.append(filters,cards,choiceNote);
 choiceHost.append(action('ใช้ขนาดต้นฉบับของเทมเพลต',()=>{const t=template();if(!t)return;Object.assign(quickSetupDraft,{width:t.width||6,depth:t.depth||3,height:t.height||2.4});buildTemplates();},'wizard-original-size'));
 footer(choicesPanel,'layout',()=>{if(session.mode==='current'&&!session.base)session.base=structuredClone(session.original);if(!session.base)pick('blank');show('customize');},'wizard-template-next');
 const customize=panel('customize','ปรับแต่งแบบ','ใช้ค่าตามแบบตั้งต้นได้เลย หรือเปิดเฉพาะส่วนที่ต้องการแก้ · แบบจริงยังไม่เปลี่ยน');
 const options=customize.querySelector('.wizard-content');
 options.append(action('คืนค่าตามแบบตั้งต้น',()=>{resetCustom();fillCustom();requestPreview();},'wizard-keep-original'));
 const themeDetails=node('details'),themeSummary=node('summary','ธีมสีบูธ');themeDetails.append(themeSummary);
 const themes=node('div',null,'wizard-themes');
 themes.append(action('สีเดิมของแบบ',()=>{quickSetupDraft.theme=null;fillTheme();requestPreview();},'wizard-theme-original'));
 YPBoothTheme.presets.forEach((p,i)=>{const b=action(p.name,()=>{quickSetupDraft.theme=YPBoothTheme.normalize(p);fillTheme();requestPreview();},'wizard-theme-'+i);const band=node('span',null,'wizard-swatches');for(const k of ['primary','secondary','accent']){const sw=node('i');sw.style.background=p[k];band.append(sw);}b.prepend(band);themes.append(b);});themeDetails.append(themes);
 const colors=node('div',null,'wizard-dimensions');
 for(const [k,label] of [['primary','สีหลัก'],['secondary','สีรอง'],['accent','สีเน้น']]){const l=node('label',label),i=node('input');i.type='color';i.id='wizard-color-'+k;i.onchange=()=>{quickSetupDraft.theme=YPBoothTheme.normalize({...themeValue(),[k]:i.value,name:'กำหนดเอง'});fillTheme();requestPreview();};l.append(i);colors.append(l);}themeDetails.append(colors,node('p','เก็บโลโก้ รูปสินค้า จอ ต้นไม้ และลายไม้เดิมเป็นค่าเริ่มต้น','wizard-note'));options.append(themeDetails);
 const floorDetails=node('details');floorDetails.id='wizard-floor-details';floorDetails.append(node('summary','พื้นและวัสดุปูพื้น'));
 for(const n of [...$('quickStepFloor').querySelector('.quick-step-scroll').children])if(n.tagName!=='HEADER')floorDetails.append(n);options.append(floorDetails);
 const roomDetails=node('details');roomDetails.append(node('summary','ห้องเก็บของ'));
 const roomLabel=node('label','การจัดการห้อง'),roomSelect=node('select');roomSelect.id='wizard-room';
 for(const [value,text] of [['keep','เก็บห้องและโครงสร้างตามแบบ'],['add','เพิ่มห้องมาตรฐาน 1.2 × 1.2 ม.'],['remove-standard','เอาเฉพาะห้องมาตรฐานของระบบออก']]){const o=node('option',text);o.value=value;roomSelect.append(o);}roomSelect.onchange=()=>{quickSetupDraft.roomMode=roomSelect.value;roomNote();requestPreview();};roomLabel.append(roomSelect);roomDetails.append(roomLabel,node('p',null,'wizard-note'));roomDetails.querySelector('p').id='wizard-room-note';options.append(roomDetails);
 footer(customize,'template',()=>show('review'),'wizard-customize-next','ตรวจสอบแบบ');
 const review=panel('review','ตรวจสอบและเริ่มออกแบบ','ตรวจพรีวิวและปลายทางก่อนยืนยัน · อีกแบบ A/B จะไม่เปลี่ยน');
 const reviewHost=review.querySelector('.wizard-content'),summary=node('dl');summary.id='wizard-review-summary';reviewHost.append(summary);
 const targetLabel=node('label','ใช้ผลนี้ใน'),target=node('select');target.id='wizard-target';for(const slot of ['A','B']){const o=node('option','แบบ '+slot);o.value=slot;target.append(o);}target.onchange=()=>{session.target=target.value;reviewSummary();};targetLabel.append(target);reviewHost.append(targetLabel);
 reviewHost.append(node('p','หากใช้ในแบบที่มีงานอยู่ จะถามยืนยันก่อนแทนที่ แนะนำให้บันทึกไฟล์หากต้องการเก็บแบบเดิม','wizard-note'));
 footer(review,'customize',finish,'wizard-finish','ยืนยันและเริ่มออกแบบ');
 const previewBox=node('section',null,'wizard-preview');previewBox.innerHTML='<h3>พรีวิวแบบที่จะใช้จริง</h3><iframe id="wizard-preview-frame" title="พรีวิวบูธใน Wizard"></iframe><p id="wizard-preview-status" role="status" aria-live="polite"></p><button type="button" class="btn" id="wizard-preview-retry" hidden>โหลดพรีวิวใหม่</button><p class="wizard-note">หมุนดูได้ · การเปลี่ยนพื้นที่ไม่ยืดเฟอร์นิเจอร์หรือโครงสร้างเทมเพลต โปรดตรวจระยะและชิ้นส่วนที่อยู่นอกพื้นที่</p>';
 previewBox.hidden=true;modal.querySelector('.release-sheet').append(previewBox);
 $('wizard-preview-retry').onclick=()=>{stopPreview();requestPreview();};
 const errorBox=node('p',null,'quick-error');errorBox.id='wizard-error';errorBox.setAttribute('role','alert');reviewHost.append(errorBox);
 // Intro distinguishes editing the existing snapshot from replacing it.
 $('releaseIntro').textContent='เลือกแบบตั้งต้น ปรับเฉพาะที่ต้องการ และตรวจพรีวิวก่อนใช้กับแบบ A/B';
 modal.querySelector('.release-list').replaceChildren(...['ข้อมูลธุรกิจและโจทย์งาน','พื้นที่และรูปแบบบูธ','เลือกเทมเพลตหรือบูธเปล่า','ปรับแต่งสี พื้น และห้อง (ข้ามได้)','ตรวจสอบก่อนเริ่มออกแบบ'].map((text,i)=>{const n=node('li',null,'release-note');n.append(node('span',String(i+1).padStart(2,'0'),'release-note-index'),node('span',text));return n;}));
 const modeHost=node('div',null,'wizard-entry-modes');modeHost.append(action('ปรับงานปัจจุบัน',()=>begin('current'),'wizard-edit-current'),action('เริ่มบูธใหม่',()=>begin('new'),'wizard-start-new'));$('releaseStart').hidden=true;$('releaseStart').before(modeHost);$('releaseSkip').textContent='กลับหน้าออกแบบ';
 function begin(mode,start='business'){
   const ws=YPProjectWorkspace.state();if(!ws.ready||ws.busy||ws.pendingDraft)return;
   const original=YPProjectBridge.capture();session={mode,original,expectedDesign:model.designSignature(original.spec),active:ws.active,target:ws.active,base:mode==='current'?structuredClone(original):YPProjectBridge.initialSnapshot()};
   const s=original.spec;quickSetupDraft={businessCategoryId:s.cat,customBusinessCategory:s.customBusinessCategory||'',businessBrief:YPBusinessBrief.normalize(s.businessBrief),boothType:model.steps&&['inline','corner','penin','island'].includes(s.type)?s.type:'inline',cornerSide:s.cornerSide||'right',width:s.W,depth:s.D,height:s.H,brandTouched:true,primary:s.primary,templateId:null};
   selected=mode==='current'?'current':'blank';filter='all';resetCustom();show(start);
 }
 function resetCustom(){const s=session.base.spec;Object.assign(quickSetupDraft,{theme:null,floorChanged:false,floor:s.floor,tile:s.tile,carpet:s.carpet,raise:s.raise,roomMode:'keep'});}
 function pick(id){
   selected=id;const d=quickSetupDraft;
   session.base=id==='current'?structuredClone(session.original):id==='blank'?YPProjectBridge.initialSnapshot():bridge(d.boothType).snapshot(id,{cornerSide:d.cornerSide});
   d.templateId=['blank','current'].includes(id)?null:id;d.primary=session.base.spec.primary;resetCustom();buildTemplates();
 }
 function updateArea(){
   const d=quickSetupDraft,error=model.validate(d);$('quickLayoutError').textContent=error;$('quickLayoutNext').disabled=!!error;
   $('quickLayoutSummary').textContent=Number.isFinite(d.width*d.depth)?'กว้าง '+d.width+' × ลึก '+d.depth+' × สูง '+d.height+' ม. · '+(d.width*d.depth).toFixed(1)+' ตร.ม.':'';
   for(const key of ['width','depth','height'])$('wizard-'+key).setAttribute('aria-invalid',String(!Number.isFinite(d[key])||d[key]<(key==='height'?2.4:1)||d[key]>(key==='height'?4.9:30)));
 }
 function buildArea(){
   const d=quickSetupDraft;for(const key of ['width','depth','height'])$('wizard-'+key).value=d[key];
   const host=$('quickBoothTypes');host.replaceChildren();
   for(const t of TYPES.filter(t=>['inline','corner','penin','island'].includes(t.k))){host.append(createQuickChoice({value:t.k,label:t.n,detail:'เปิด '+quickBoothDefaults(t.k).openSides+' ด้าน',selected:d.boothType===t.k,onSelect:()=>{if(d.boothType!==t.k){d.boothType=t.k;d.cornerSide=d.cornerSide||'right';pick(session.mode==='current'?'current':'blank');}buildArea();}}));}
   const corners=$('quickCornerSides');corners.hidden=d.boothType!=='corner';corners.replaceChildren();for(const c of CORNER_SIDES)corners.append(createQuickChoice({value:c.k,label:c.n,detail:c.s,selected:d.cornerSide===c.k,onSelect:()=>{d.cornerSide=c.k;if(template())pick(selected);buildArea();}}));updateArea();
 }
 function buildTemplates(){
   const d=quickSetupDraft;cards.replaceChildren();
   for(const id of (session.mode==='current'?['current','blank']:['blank'])){const b=action(id==='current'?'เก็บแบบปัจจุบัน':'เริ่มจากบูธเปล่า',()=>pick(id));b.dataset.template=id;b.setAttribute('aria-pressed',String(id===selected));cards.append(b);}
   const list=library(d.boothType).templates.filter(t=>filter!=='exact'||(t.width||6)===d.width&&(t.depth||3)===d.depth);
   for(const t of list){const b=action('',()=>pick(t.id));b.dataset.template=t.id;b.classList.add('wizard-template-card');b.setAttribute('aria-pressed',String(selected===t.id));const img=node('img');img.src=imageFor(t);img.alt='';img.loading='lazy';b.append(img,node('strong',t.name),node('span',(t.width||6)+' × '+(t.depth||3)+' ม. · สูง '+(t.height||2.4)+' ม.'),node('small',t.tagline||''));cards.append(b);}
   for(const f of ['all','exact'])$('wizard-filter-'+f).setAttribute('aria-pressed',String(filter===f));
   const t=template();$('wizard-original-size').hidden=!t;
   choiceNote.textContent=(list.length?'':'ไม่มีเทมเพลตตรงขนาดนี้ เลือก “ทุกขนาด” เพื่อปรับใช้ได้ · ')+(t?'เลือก '+t.name+' · ':selected==='current'?'เก็บงานปัจจุบัน · ':'บูธเปล่า · ')+'พื้นที่ที่จะใช้ '+d.width+' × '+d.depth+' × '+d.height+' ม.'+(t&&((t.width||6)!==d.width||(t.depth||3)!==d.depth||(t.height||2.4)!==d.height)?' · ขนาดต่างจากต้นฉบับ ปรับเฉพาะพื้นที่ระบบ ไม่ยืดหรือย้ายชิ้นส่วนอัตโนมัติ':'');
 }
 function themeValue(){return quickSetupDraft.theme||session.base.spec.boothColorTheme||{name:'กำหนดเอง',primary:session.base.spec.primary||'#f72585',secondary:'#f3f0e8',accent:'#30343b'};}
 function fillTheme(){for(const k of ['primary','secondary','accent'])$('wizard-color-'+k).value=themeValue()[k];$('wizard-theme-original').setAttribute('aria-pressed',String(!quickSetupDraft.theme));YPBoothTheme.presets.forEach((p,i)=>$('wizard-theme-'+i).setAttribute('aria-pressed',String(quickSetupDraft.theme?.name===p.name)));}
 function roomNote(){const d=quickSetupDraft,s=session.base.spec;$('wizard-room-note').textContent=d.roomMode==='add'?'เพิ่มห้องระบบอีก 1 ห้อง โดยไม่ลบห้องที่ประกอบมากับเทมเพลต อาจซ้อนกับของเดิม โปรดตรวจพรีวิวและจัดตำแหน่งต่อในหน้าออกแบบ':d.roomMode==='remove-standard'?'นำออกเฉพาะห้องระบบ ห้องที่ประกอบจากอุปกรณ์ในเทมเพลตยังอยู่ และแก้ต่อได้ในหน้าออกแบบ':(s.stSize!=='none'?'เก็บห้องระบบเดิม พร้อม':'ไม่เพิ่มห้องระบบใหม่ · เก็บ')+'ห้องและโครงสร้างที่ประกอบอยู่ในแบบทั้งหมด';}
 const oldFloorUpdate=updateQuickFloorStep;
 updateQuickFloorStep=function(){oldFloorUpdate();if(session&&quickSetupStep==='customize'&&!session.filling){quickSetupDraft.floorChanged=true;requestPreview();}};
 function fillCustom(){session.filling=true;fillTheme();buildQuickFloorChoices();updateQuickFloorStep();$('wizard-room').value=quickSetupDraft.roomMode;roomNote();session.filling=false;}
 function result(){return model.build(session.base,quickSetupDraft,YPBusinessBrief.normalize);}
 function reviewSummary(){
   const d=quickSetupDraft,s=result().spec;summary.replaceChildren();
   for(const [k,v] of [['แบบตั้งต้น',template()?.name||(selected==='current'?'งานปัจจุบัน':'บูธเปล่า')],['ธุรกิจ',businessCategoryLabel(s)],['พื้นที่',(TYPES.find(t=>t.k===s.type)?.n||s.type)+' · '+s.W+' × '+s.D+' × '+s.H+' ม.'+(s.type==='corner'?' · '+(s.cornerSide==='left'?'หัวมุมซ้าย':'หัวมุมขวา'):'')],['ธีมสี',d.theme?.name||'เก็บสีเดิมของแบบ'],['พื้น',(FLOORS.find(f=>f.k===s.floor)?.n||s.floor)+' · '+(s.floor==='tile'?TILES.find(t=>t.k===s.tile)?.n||s.tile:s.floor==='carpet'?CARPETS.find(c=>c.k===s.carpet)?.n||s.carpet:'')+' · ยก '+s.raise+' ซม.'],['ห้อง',d.roomMode==='keep'?'เก็บห้องและโครงสร้างเดิม':d.roomMode==='add'?'เพิ่มห้องระบบอีก 1 ห้อง · ตรวจการซ้อน':'เอาเฉพาะห้องระบบออก'],['ปลายทาง','แบบ '+session.target+' · อีกแบบไม่เปลี่ยน']])summary.append(node('dt',k),node('dd',v));
   for(const field of YPBusinessBrief.fields)if(d.businessBrief[field.key])summary.append(node('dt',field.label),node('dd',d.businessBrief[field.key]));target.value=session.target;
 }
 function show(key){
   if(!session&&key!=='intro'){begin('current',model.steps.includes(key)?key:'business');return;}
   key=({brand:'customize',floor:'customize',room:'review'}[key]||key);if(!['intro',...model.steps].includes(key))return;
   quickSetupStep=key;
   modal.querySelectorAll('[data-quick-step]').forEach(p=>{p.hidden=p.dataset.quickStep!==key;});
   modal.querySelectorAll('[data-progress-step]').forEach((p,i)=>{p.classList.toggle('current',p.dataset.progressStep===key);p.classList.toggle('complete',i<model.steps.indexOf(key));p.setAttribute('aria-current',p.dataset.progressStep===key?'step':'false');});
   if(key==='business'){buildQuickBusinessChoices();updateQuickBusinessStep();}
   if(key==='layout')buildArea();if(key==='template')buildTemplates();
   if(['customize','review'].includes(key)){
     // Keep the same connected iframe: moving it would reload its browsing context.
     previewBox.hidden=false;if(!previewBox.isConnected)modal.querySelector('.release-sheet').append(previewBox);
     if(key==='customize')fillCustom();else reviewSummary();requestPreview();
   }else{previewBox.hidden=true;stopPreview();}
   modal.querySelector('.release-sheet').dataset.wizardStep=key;
   const p=modal.querySelector('[data-quick-step="'+key+'"]');p.querySelector('.quick-step-scroll')?.scrollTo(0,0);requestAnimationFrame(()=>p.querySelector('h2')?.focus());
 }
 function stopPreview(){if(preview)clearTimeout(preview.timer);preview=null;$('wizard-preview-frame').removeAttribute('src');$('wizard-finish').disabled=true;}
 function failPreview(message){$('wizard-preview-status').textContent=message+' · ยังไม่เปลี่ยนแบบจริง';$('wizard-preview-retry').hidden=false;$('wizard-finish').disabled=true;}
 function pump(){const p=preview;if(!p?.ready||p.busy||!p.pending)return;const next=p.pending;p.pending=null;p.busy=true;clearTimeout(p.timer);p.timer=setTimeout(()=>failPreview('โหลดพรีวิวไม่สำเร็จ กรุณาลองใหม่'),45000);$('wizard-preview-frame').contentWindow.postMessage({channel:'yp-mixer',token:p.token,type:'render',...next},location.origin);}
 function requestPreview(){
   if(!session||!['customize','review'].includes(quickSetupStep))return;
   $('wizard-finish').disabled=true;$('wizard-preview-retry').hidden=true;$('wizard-preview-status').textContent='กำลังเตรียมพรีวิว · งานจริงยังไม่เปลี่ยน';
   if(!preview){preview={token:crypto.randomUUID(),revision:0,ready:false,busy:false};const url=new URL(location.href);url.search='?comparePreview=1&mixToken='+preview.token;$('wizard-preview-frame').src=url.href;preview.timer=setTimeout(()=>failPreview('โหลดพรีวิวไม่สำเร็จ กรุณาลองใหม่'),45000);}
   try{preview.pending={revision:++preview.revision,snapshot:result()};pump();}catch(e){failPreview(e.message);}
 }
 addEventListener('message',e=>{const p=preview,m=e.data;if(!p||e.source!==$('wizard-preview-frame').contentWindow||e.origin!==location.origin||m?.channel!=='yp-mixer'||m.token!==p.token)return;
   if(m.type==='ready'){p.ready=true;pump();return;}
   if(!['rendered','error'].includes(m.type))return;clearTimeout(p.timer);p.busy=false;
   if(m.type==='error'&&(!m.revision||m.revision===p.revision)){failPreview(m.message||'โหลดพรีวิวไม่สำเร็จ');return;}
   if(m.revision===p.revision){p.rendered=m.revision;$('wizard-preview-status').textContent='พรีวิวพร้อม · หมุนตรวจแบบได้ก่อนยืนยัน';$('wizard-finish').disabled=false;}
   pump();
 });
 async function finish(){
   if(quickSetupCompleting||!preview||preview.rendered!==preview.revision||$('wizard-finish').disabled)return;
   const current=session;quickSetupCompleting=true;$('wizard-finish').disabled=true;$('wizard-error').textContent='';
   try{const snapshot=result();const reply=await YPProjectWorkspace.useWizard({makeSnapshot:()=>snapshot,name:template()?.name||(selected==='current'?'ปรับงานปัจจุบัน':'บูธเปล่า'),target:current.target,expectedActive:current.active,expectedDesign:current.expectedDesign});
     if(!reply.ok){$('wizard-error').textContent=reply.message;return;}
     quickSetupCompleting=false;closeReleaseNotes(false);closeDockPanel(false);loadThreeRenderer().then(r=>r.setCameraView('perspective')).catch(()=>{});dispatchEvent(new CustomEvent('yp:quick-setup-complete',{detail:{templateId:selected}}));
   }catch(e){$('wizard-error').textContent=e.message;}finally{quickSetupCompleting=false;if(session===current)$('wizard-finish').disabled=preview?.rendered!==preview?.revision;}
 }
 // Modal keyboard/focus behavior remains shared with the existing Wizard shell.
 setQuickSetupStep=show;
 const oldClose=closeReleaseNotes;
 closeReleaseNotes=function(discard=true){if(quickSetupCompleting)return;stopPreview();session=null;oldClose(discard);opener?.focus();};
 YPQuickSetupBridge.open=function({start='intro'}={}){opener=document.activeElement;quickSetupCompleting=false;modal.classList.add('show');modal.setAttribute('aria-hidden','false');stopPreview();session=null;if(start==='business')begin('new');else show('intro');};
 $('quickBusinessNext').onclick=()=>{quickBusinessAttempted=true;updateQuickBusinessStep();if(!quickBusinessValidation())show('layout');};
 $('quickBusinessBack').onclick=()=>show('intro');$('quickLayoutBack').onclick=()=>show('business');$('quickLayoutNext').onclick=()=>{updateArea();if(!model.validate(quickSetupDraft))show('template');};
 // Editor shortcuts must not operate behind the Wizard, including Enter in fields.
 modal.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT')e.preventDefault();});
 window.YPWizardV2={begin,show,result,getState:()=>({mode:session?.mode,selected,step:quickSetupStep,target:session?.target,previewReady:!!preview&&preview.rendered===preview.revision})};
 show('intro');
})();

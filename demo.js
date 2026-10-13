import './demo.css';
// Browser-only demo adapter: no API keys, remote generation or backend requests.
export const DEMO_VERSION = 'frontend-demo-v1-20261013';
const viewNames = ['正面', '侧面', '背面', '仰视', '俯视', '细节'];

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('照片读取失败，请重新上传'));
    image.src = source;
  });
}

function contain(context, image, x, y, width, height) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
  context.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

async function previewViews(source, instruction = '') {
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const context = canvas.getContext('2d');
  context.fillStyle = '#FFFDF9';
  context.fillRect(0, 0, canvas.width, canvas.height);
  viewNames.forEach((name, index) => {
    const x = (index % 3) * 400, y = Math.floor(index / 3) * 400;
    context.fillStyle = '#F8F0E5';
    context.fillRect(x + 12, y + 12, 376, 376);
    contain(context, image, x + 32, y + 28, 336, 280);
    context.fillStyle = '#4A3B32';
    context.textAlign = 'center';
    context.font = '22px sans-serif';
    context.fillText(`${name} · 布局示意`, x + 200, y + 342);
    context.font = '15px sans-serif';
    context.fillText('使用原照片预览，未生成新视角', x + 200, y + 372);
  });
  return {
    sheet: canvas.toDataURL('image/jpeg', .9),
    views: viewNames,
    promptVersion: DEMO_VERSION,
    demo: true,
    instruction,
    validation: { demo: true, checked: false }
  };
}

async function previewPostcard({ name, character }) {
  const image = await loadImage(character);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const context = canvas.getContext('2d');
  const background = context.createLinearGradient(0, 0, 1200, 600);
  background.addColorStop(0, '#E5D8C8');
  background.addColorStop(1, '#B8CFCE');
  context.fillStyle = background;
  context.fillRect(0, 0, 1200, 600);
  contain(context, image, 220, 30, 760, 530);
  context.fillStyle = '#4A3B32';
  context.font = '18px sans-serif';
  context.textAlign = 'left';
  context.fillText('纯前端演示 · 原照片排版，非 AI 生成', 30, 580);
  context.fillStyle = '#FFFDF9';
  context.fillRect(0, 600, 1200, 200);
  context.fillStyle = '#4A3B32';
  context.font = '32px "Ma Shan Zheng", cursive, sans-serif';
  context.fillText('风把你的思念带来啦，', 50, 680);
  context.fillText('今天也把暖暖的阳光寄给你。', 50, 733);
  contain(context, image, 892, 616, 85, 70);
  context.font = '24px "Ma Shan Zheng", cursive, sans-serif';
  context.textAlign = 'center';
  context.fillText(String(name).slice(0, 12), 935, 718);
  const date = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date()).replaceAll('/', '.');
  context.font = '18px sans-serif';
  context.fillText(date, 935, 750);
  context.strokeStyle = '#8C7A6B';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(1100, 707, 48, 0, Math.PI * 2);
  context.stroke();
  context.font = '20px sans-serif';
  context.fillText('云端', 1100, 714);
  return {
    image: canvas.toDataURL('image/jpeg', .9),
    scene: '演示明信片 · 一束阳光',
    copy: '风把你的思念带来啦，\n今天也把暖暖的阳光寄给你。',
    date,
    demo: true
  };
}

export async function requestDemo(action, payload) {
  // A short delay preserves loading/cancel interactions without a network call.
  await new Promise(resolve => setTimeout(resolve, 650));
  switch (action) {
    case 'demo:portrait:base':
      await loadImage(payload.image);
      return {
        image: payload.image, promptVersion: DEMO_VERSION, demo: true,
        validation: { demo: true, checked: false, needsUserReview: false }
      };
    case 'demo:portrait:views':
      return previewViews(payload.baseImage, payload.instruction);
    case 'demo:portrait:refine': {
      const key = 'frontend-demo-refine-instructions';
      const records = JSON.parse(localStorage.getItem(key) || '[]');
      records.push({ name: payload.name, instruction: payload.instruction, createdAt: Date.now() });
      localStorage.setItem(key, JSON.stringify(records.slice(-50)));
      return previewViews(payload.baseImage, payload.instruction);
    }
    case 'demo:letter':
      return previewPostcard(payload);
    default:
      throw new Error('纯前端演示不支持这个操作');
  }
}

export function installDemoLabels() {
  const notice = document.createElement('button');
  notice.type = 'button';
  notice.className = 'frontend-demo-notice';
  notice.textContent = '纯前端体验版 · 不调用 AI';
  notice.onclick = () => {
    const dialog = document.querySelector('#frontendDemoDialog');
    if (!dialog.open) dialog.showModal();
  };
  const dialog = document.createElement('dialog');
  dialog.id = 'frontendDemoDialog';
  dialog.innerHTML = '<h2>关于体验版</h2><p>本版本适配纯前端平台，保留上传、确认、收信、写星星和保存等交互。照片只在当前浏览器处理，不会发送到模型。</p><p>基础形象使用原照片，六视图是排版示意；微调只记录修改要求，不会改变照片。明信片用浏览器本地排版，不是真实 AI 生图，也没有一致性校验。</p><p>数据仅保存在当前浏览器；没有跨设备同步。定时投递仅在页面运行或重新打开时检查，关闭页面后不会后台生成。</p><button type="button">知道了</button>';
  dialog.querySelector('button').onclick = () => dialog.close();
  document.querySelector('.app-shell').append(notice, dialog);

  const setText = (selector, text) => {
    const element = document.querySelector(selector);
    if (element && element.textContent !== text) element.textContent = text;
  };
  // Existing UI state updates are observed so loading/confirmation remains honest.
  const update = () => {
    setText('#createPet', document.querySelector('#createPet').disabled ? '正在准备演示…' : '体验宝贝形象建立流程');
    setText('#petBaseReview .review-heading p:last-child', '演示使用上传的原照片，不进行 AI 卡通化。确认后可以体验六视图排版流程。');
    setText('#petBaseReview .base-character span', '原照片预览 · 非 AI 生成');
    setText('#petViewsLoading h2', '正在准备演示');
    setText('#petViewsLoading p', '即将展示六视图布局，图片仍为原照片');
    setText('#petReview .review-heading h2', '六视图布局预览');
    setText('#petReview .review-heading p:last-child', '六个位置仅展示同一原照片，不是真实视角生成；本版本没有 AI 一致性校验。');
    setText('#showRefine', '记录微调要求');
    setText('#regenerateBase', document.querySelector('#regenerateBase').disabled ? '正在准备…' : '重新预览');
    setText('#submitRefine', document.querySelector('#submitRefine').disabled ? '正在记录…' : '保存要求并预览布局');
    setText('#toast', document.querySelector('#toast').textContent.replace('生成中，可能需要1-2分钟', '正在准备演示').replace('基础形象已生成', '原照片演示预览已准备').replace('六视图已生成', '六视图演示布局已准备').replace('微调完成，并已通过一致性检查', '微调要求已记录；演示版未修改图片或进行校验').replace('照片已收到，已自动提取衣服与配饰细节', '照片已收到，将在当前浏览器中预览').replace('第一封明信片正在从云端寄来', '第一封演示明信片正在本地排版'));
    setText('#postcardExpectation p', '完整产品计划每 1–2 天寄来新明信片。本体验版仅在页面运行时模拟到信，关闭后不会后台生成。');
  };
  update();
  new MutationObserver(update).observe(document.querySelector('.app-shell'), {
    childList: true, subtree: true, characterData: true
  });
}

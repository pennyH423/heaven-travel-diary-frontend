import './demo.css';
// Browser-only demo adapter: no API keys, remote generation or backend requests.
export const DEMO_VERSION = 'frontend-demo-v2-daxiong-20261013';
const viewNames = ['正面', '侧面', '背面', '仰视', '俯视', '细节'];
const presetFiles = new Map();
export function loadDemoAsset(filename) {
  if (!presetFiles.has(filename)) presetFiles.set(filename, (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}assets/demo/${filename}`);
    if (!response.ok) throw new Error('示例素材读取失败，请刷新后重试');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('示例素材读取失败'));
      reader.readAsDataURL(blob);
    });
  })().catch(error => { presetFiles.delete(filename); throw error; }));
  return presetFiles.get(filename);
}
let presetManifest;
async function getPresetManifest() {
  if (!presetManifest) {
    const response = await fetch(`${import.meta.env.BASE_URL}assets/demo/manifest.json`);
    if (!response.ok) throw new Error('示例资料读取失败，请刷新后重试');
    presetManifest = await response.json();
  }
  return presetManifest;
}
async function isPresetPhoto(source) {
  return Boolean(source) && source === await loadDemoAsset('sample-pet-photo.jpg');
}
async function presetViews(instruction = '') {
  return { sheet: await loadDemoAsset('sample-pet-six-views.png'), views: viewNames,
    promptVersion: DEMO_VERSION, demo: true, preset: true, instruction,
    validation: { demo: true, checked: false, preGenerated: true } };
}

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
  const preset = await isPresetPhoto(payload.image || payload.sourceImage);
  switch (action) {
    case 'demo:portrait:base':
      if (preset) return {
        image: await loadDemoAsset('sample-pet-avatar.png'), promptVersion: DEMO_VERSION,
        demo: true, preset: true,
        validation: { demo: true, checked: false, preGenerated: true, needsUserReview: false }
      };
      await loadImage(payload.image);
      return {
        image: payload.image, promptVersion: DEMO_VERSION, demo: true,
        validation: { demo: true, checked: false, needsUserReview: false }
      };
    case 'demo:portrait:views':
      if (preset) return presetViews();
      return previewViews(payload.baseImage, payload.instruction);
    case 'demo:portrait:refine': {
      const key = 'frontend-demo-refine-instructions';
      const records = JSON.parse(localStorage.getItem(key) || '[]');
      records.push({ name: payload.name, instruction: payload.instruction, createdAt: Date.now() });
      localStorage.setItem(key, JSON.stringify(records.slice(-50)));
      if (preset) return presetViews(payload.instruction);
      return previewViews(payload.baseImage, payload.instruction);
    }
    case 'demo:letter':
      if (preset) {
        const metadata = await getPresetManifest();
        return { image: await loadDemoAsset('sample-pet-postcard.png'),
          scene: metadata.scene, copy: metadata.copy, date: metadata.date,
          demo: true, preset: true };
      }
      return previewPostcard(payload);
    default:
      throw new Error('纯前端演示不支持这个操作');
  }
}

export function installDemoLabels() {
  const notice = document.createElement('button');
  notice.type = 'button';
  notice.className = 'frontend-demo-notice';
  notice.textContent = '体验版 · 预置 AI 素材';
  notice.onclick = () => {
    const dialog = document.querySelector('#frontendDemoDialog');
    if (!dialog.open) dialog.showModal();
  };
  const dialog = document.createElement('dialog');
  dialog.id = 'frontendDemoDialog';
  dialog.innerHTML = '<h2>关于体验版</h2><p>已准备大熊的真实照片、基础卡通形象、六个不同视角和成品明信片，不用寻找照片即可完整体验。配套素材已提前通过 AI 制作，页面不实时调用模型。</p><p>你仍可上传自己的照片；自传照片仅做原图与排版预览，不会冒充大熊的 AI 结果。微调入口记录要求，但体验版不会实际修改图片。示例明信片中的署名固定为大熊。</p><p>照片与交互数据仅保存在当前浏览器，没有跨设备同步。模拟投递仅在页面运行或重新打开时检查，关闭页面不会后台生成新图片。</p><button type="button">知道了</button>';
  dialog.querySelector('button').onclick = () => dialog.close();
  document.querySelector('.app-shell').append(notice, dialog);

  const setText = (selector, text) => {
    const element = document.querySelector(selector);
    if (element && element.textContent !== text) element.textContent = text;
  };
  // Existing UI state updates are observed so loading/confirmation remains honest.
  const update = () => {
    setText('#createPet', document.querySelector('#createPet').disabled ? '正在准备演示…' : '体验宝贝形象建立流程');
    setText('#petBaseReview .review-heading p:last-child', '先确认物种、毛色和衣服，再进入六视图。大熊示例展示预先生成的基础形象；自传照片只做原图预览。');
    setText('#petBaseReview .base-character span', '基础形象 · 体验预览');
    setText('#petViewsLoading h2', '正在准备演示');
    setText('#petViewsLoading p', '确认基础形象后，再准备六个视角');
    setText('#petReview .review-heading h2', '六个视角，都还是熟悉的它');
    setText('#petReview .review-heading p:last-child', '大熊示例为预先生成的正面、侧面、背面、仰视、俯视和细节；自传照片只展示六格排版示意。');
    setText('#showRefine', '记录微调要求');
    setText('#regenerateBase', document.querySelector('#regenerateBase').disabled ? '正在准备…' : '重新预览');
    setText('#submitRefine', document.querySelector('#submitRefine').disabled ? '正在记录…' : '保存要求并预览布局');
    setText('#toast', document.querySelector('#toast').textContent.replace('生成中，可能需要1-2分钟', '正在准备演示').replace('基础形象已生成', '基础形象体验预览已准备').replace('六个视角已生成，并通过一致性检查', '六个视角体验预览已准备，请确认').replace('微调完成，并已通过一致性检查', '微调要求已记录；体验版未修改图片').replace('照片已收到，已自动提取衣服与配饰细节', '照片已收到，将在当前浏览器中预览').replace('第一封明信片正在从云端寄来', '第一封体验明信片正在送往邮筒'));
    setText('#postcardExpectation p', '完整产品计划每 1–2 天寄来新明信片。本体验版仅在页面运行时模拟到信，关闭后不会后台生成。');
  };
  update();
  new MutationObserver(update).observe(document.querySelector('.app-shell'), {
    childList: true, subtree: true, characterData: true
  });
}

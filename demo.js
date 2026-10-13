import './demo.css';

// Browser-only adapter for the static import. Nothing is sent to a model.
export const DEMO_VERSION = 'frontend-demo-v2-preloaded-pet-20261013';
const viewNames = ['正面', '侧面', '背面', '仰视', '俯视', '细节'];
export const DEMO_ASSETS = {
  photo: './assets/demo/pet-photo.png',
  avatar: './assets/demo/pet-avatar.png',
  views: './assets/demo/pet-six-views.svg',
  postcard: './assets/demo/pet-postcard.png'
};

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('演示素材读取失败，请刷新页面'));
    image.src = source;
  });
}

async function previewViews(instruction = '') {
  await loadImage(DEMO_ASSETS.views);
  return { sheet: DEMO_ASSETS.views, views: viewNames, promptVersion: DEMO_VERSION, demo: true, instruction, validation: { demo: true, checked: false, identity: 'bundled-sample' } };
}

async function previewPostcard({ name }) {
  await loadImage(DEMO_ASSETS.postcard);
  return { image: DEMO_ASSETS.postcard, scene: '小溪边散步', copy: '风把你的思念带来啦，\n今天也把暖暖的阳光寄给你。', date: '2026.07.18', petName: name, demo: true };
}

export async function requestDemo(action, payload = {}) {
  await new Promise(resolve => setTimeout(resolve, 650));
  switch (action) {
    case 'demo:portrait:base':
      await loadImage(DEMO_ASSETS.avatar);
      return { image: DEMO_ASSETS.avatar, promptVersion: DEMO_VERSION, demo: true, validation: { demo: true, checked: false, needsUserReview: false, identity: 'bundled-sample' } };
    case 'demo:portrait:views': return previewViews(payload.instruction);
    case 'demo:portrait:refine': {
      const key = 'frontend-demo-refine-instructions';
      const records = JSON.parse(localStorage.getItem(key) || '[]');
      records.push({ name: payload.name, instruction: payload.instruction, createdAt: Date.now() });
      localStorage.setItem(key, JSON.stringify(records.slice(-50)));
      return previewViews(payload.instruction);
    }
    case 'demo:letter': return previewPostcard(payload);
    default: throw new Error('纯前端体验不支持这个操作');
  }
}

export function installDemoLabels() {
  const notice = document.createElement('button');
  notice.type = 'button'; notice.className = 'frontend-demo-notice'; notice.textContent = '纯前端体验版 · 已预置示例素材';
  notice.onclick = () => { const dialog = document.querySelector('#frontendDemoDialog'); if (!dialog.open) dialog.showModal(); };
  const dialog = document.createElement('dialog'); dialog.id = 'frontendDemoDialog';
  dialog.innerHTML = '<h2>关于体验版</h2><p>本版本预置了一只虚构示例宠物的照片、基础形象、六视图和成品明信片，打开页面即可完整体验，不需要先找图片上传。你仍然可以点击上传入口替换成自己的照片。</p><p>示例素材是随前端打包的静态图片：确认基础形象后展示六视图，再确认建档并收到欢迎明信片；微调会记录要求并重新展示预置六视图，不会调用 AI。</p><p>数据仅保存在当前浏览器；没有跨设备同步。定时投递仅在页面运行或重新打开时检查，关闭页面后不会后台生成。</p><button type="button">知道了</button>';
  dialog.querySelector('button').onclick = () => dialog.close(); document.querySelector('.app-shell').append(notice, dialog);
  const setText = (selector, text) => { const element = document.querySelector(selector); if (element && element.textContent !== text) element.textContent = text; };
  const update = () => {
    setText('#createPet', document.querySelector('#createPet').disabled ? '正在准备演示…' : '体验宝贝形象建立流程');
    setText('#petBaseReview .review-heading p:last-child', '示例基础形象已准备好。确认后会进入六视图展示；也可以上传自己的照片重新体验。');
    setText('#petBaseReview .base-character span', '预置基础形象 · 可先确认');
    setText('#petViewsLoading h2', '正在准备示例六视图');
    setText('#petViewsLoading p', '六个指定视角即将展示：正面、侧面、背面、仰视、俯视、细节');
    setText('#petReview .review-heading h2', '六视图角色表');
    setText('#petReview .review-heading p:last-child', '这是与示例宠物配套的预置六视图，可确认、取消或记录微调要求。');
    setText('#showRefine', '微调形象');
    setText('#regenerateBase', document.querySelector('#regenerateBase').disabled ? '正在准备…' : '重新展示基础形象');
    setText('#submitRefine', document.querySelector('#submitRefine').disabled ? '正在记录…' : '保存要求并展示六视图');
    setText('#toast', document.querySelector('#toast').textContent.replace('生成中，可能需要1-2分钟', '正在准备演示').replace('基础形象已生成', '基础形象演示已准备').replace('六视图已生成', '六视图演示已准备').replace('微调完成，并已通过一致性检查', '微调要求已记录；演示版使用预置素材').replace('照片已收到，已自动提取衣服与配饰细节', '照片已收到，将在当前浏览器中预览').replace('第一封明信片正在从云端寄来', '第一封演示明信片正在本地准备'));
    setText('#postcardExpectation p', '完整产品计划每 1–2 天寄来新明信片。本体验版用预置素材模拟收到第一封信。');
  };
  update(); new MutationObserver(update).observe(document.querySelector('.app-shell'), { childList: true, subtree: true, characterData: true });
}

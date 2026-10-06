import { Window } from 'happy-dom';
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';

const window = new Window({ url: 'http://127.0.0.1/' });
const document = window.document;
document.body.innerHTML = '<div id="app"></div>';
globalThis.window = window;
globalThis.document = document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: window.localStorage, configurable: true });
Object.defineProperty(globalThis, 'location', { value: window.location, configurable: true });
window.matchMedia = () => ({ matches: false, media: '', addEventListener() {}, removeEventListener() {} });
window.requestAnimationFrame = (callback) => { callback(0); return 1; };
window.setInterval = () => 0;
globalThis.requestAnimationFrame = window.requestAnimationFrame;
globalThis.setInterval = window.setInterval;
window.HTMLDivElement.prototype.scrollTo = function scrollTo({ left = 0 } = {}) { this.scrollLeft = left; };
window.HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
window.HTMLDialogElement.prototype.close = function close() { this.open = false; };

const assets = readdirSync(resolve('dist/assets')).filter((file) => file.endsWith('.js'));
if (assets.length !== 1) throw new Error(`预期一个构建脚本，实际找到 ${assets.length} 个`);
await import(`${pathToFileURL(join(resolve('dist/assets'), assets[0])).href}?smoke=${Date.now()}`);

const required = ['#page-title', '#scene-viewport', '#now-button', '#sign-button', '#settings-button', '#year-button', '#about-button'];
for (const selector of required) {
  if (!document.querySelector(selector)) throw new Error(`缺少页面元素：${selector}`);
}

document.querySelector('#sign-button').click();
if (!document.querySelector('#sign-dialog').open) throw new Error('取签对话框没有打开');
document.querySelector('#sign-dialog .dialog-close').click();
if (document.querySelector('#sign-dialog').open) throw new Error('取签对话框没有关闭');

document.querySelector('#year-button').click();
if (!document.querySelector('#year-dialog').open) throw new Error('一年总览没有打开');
if (document.querySelectorAll('.year-cell').length !== 12) throw new Error('一年总览不是12个月');
document.querySelector('#year-dialog .dialog-close').click();

document.querySelector('#settings-button').click();
if (!document.querySelector('#settings-drawer').classList.contains('open')) throw new Error('设置抽屉没有打开');
document.querySelector('#city-select').value = 'shanghai';
document.querySelector('#city-select').dispatchEvent(new window.Event('change', { bubbles: true }));
if (localStorage.getItem('jinshi-city') !== 'shanghai') throw new Error('城市设置没有保存');

document.querySelector('#about-button').click();
if (!document.querySelector('#about-dialog').open) throw new Error('来源对话框没有打开');

console.log('界面冒烟检查通过：首页、取签、一年总览、设置和来源入口均可响应。');

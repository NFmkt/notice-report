import { KAKAO_APP_KEY } from './map-config.js';

let _loaded = false;
let _loading = null;

function ensureKakao() {
  if (_loaded) return Promise.resolve();
  if (_loading) return _loading;
  _loading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services&autoload=false`;
    s.onload = () => window.kakao.maps.load(() => { _loaded = true; resolve(); });
    s.onerror = () => reject(new Error('Kakao Maps SDK 로드 실패'));
    document.head.appendChild(s);
  });
  return _loading;
}

function renderMapInEl(el) {
  const raw = el.dataset.locations;
  if (!raw) return;
  let locs;
  try { locs = JSON.parse(decodeURIComponent(raw)); } catch { return; }
  if (!locs.length) return;

  const canvas = document.createElement('div');
  canvas.className = 'loc-map-canvas';
  el.appendChild(canvas);

  const map = new kakao.maps.Map(canvas, {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 5,
  });
  const bounds = new kakao.maps.LatLngBounds();
  const geo = new kakao.maps.services.Geocoder();
  let remaining = locs.length;

  locs.forEach(loc => {
    if (!loc.address) { remaining--; return; }
    geo.addressSearch(loc.address, (res, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const pos = new kakao.maps.LatLng(res[0].y, res[0].x);
        bounds.extend(pos);
        const marker = new kakao.maps.Marker({ map, position: pos });
        if (loc.name) {
          new kakao.maps.InfoWindow({
            content: `<div style="padding:5px 10px;font-size:12px;font-weight:600;font-family:Pretendard,sans-serif;white-space:nowrap;color:#1E293B">${loc.name}</div>`,
          }).open(map, marker);
        }
      }
      remaining--;
      if (remaining === 0 && !bounds.isEmpty()) {
        map.setBounds(bounds);
        if (locs.length === 1) map.setLevel(4);
      }
    });
  });
}

export async function initLocationMaps(root = document) {
  const containers = root.querySelectorAll('.loc-map-container[data-locations]');
  if (!containers.length) return;

  if (!KAKAO_APP_KEY) {
    containers.forEach(el => {
      el.innerHTML = `
        <div class="loc-map-placeholder">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>지도 표시를 위해 <code>js/map-config.js</code>에 카카오 앱키를 설정하세요</span>
          <a href="https://developers.kakao.com/" target="_blank" rel="noopener">앱키 발급받기 →</a>
        </div>`;
    });
    return;
  }

  try {
    await ensureKakao();
  } catch (e) {
    console.error('[location-map] Kakao 로드 실패:', e);
    containers.forEach(el => {
      el.innerHTML = `<div class="loc-map-placeholder">지도를 불러오지 못했습니다. 카카오 앱키와 도메인 설정을 확인하세요.</div>`;
    });
    return;
  }

  containers.forEach(el => renderMapInEl(el));
}

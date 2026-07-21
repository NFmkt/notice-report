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

// 위치 하나의 좌표를 찾는다: 주소 검색(정확) → 실패 시 키워드(장소) 검색으로 fallback.
// 도로명 주소든 "안양종합운동장" 같은 장소명이든 모두 핀이 찍히도록. LatLng 또는 null 반환.
function findPosition(loc, geo, places) {
  return new Promise(resolve => {
    const OK = kakao.maps.services.Status.OK;
    const addr = (loc.address || '').trim();
    const name = (loc.name || '').trim();

    const keywordFallback = () => {
      // 주소 → 이름+주소 → 이름 순으로 장소 검색 시도 (건물명·장소명 대응)
      const queries = [...new Set([addr, [name, addr].filter(Boolean).join(' '), name].filter(Boolean))];
      let i = 0;
      const tryNext = () => {
        if (i >= queries.length) return resolve(null);
        places.keywordSearch(queries[i++], (res, status) => {
          if (status === OK && res[0]) return resolve(new kakao.maps.LatLng(res[0].y, res[0].x));
          tryNext();
        });
      };
      tryNext();
    };

    if (addr) {
      geo.addressSearch(addr, (res, status) => {
        if (status === OK && res[0]) return resolve(new kakao.maps.LatLng(res[0].y, res[0].x));
        keywordFallback();
      });
    } else if (name) {
      keywordFallback();
    } else {
      resolve(null);
    }
  });
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
  const places = new kakao.maps.services.Places();

  Promise.all(locs.map(loc => findPosition(loc, geo, places).then(pos => ({ loc, pos }))))
    .then(results => {
      let found = 0;
      results.forEach(({ loc, pos }) => {
        if (!pos) return;
        found++;
        bounds.extend(pos);
        const marker = new kakao.maps.Marker({ map, position: pos });
        if (loc.name) {
          new kakao.maps.InfoWindow({
            content: `<div style="padding:5px 10px;font-size:12px;font-weight:600;font-family:Pretendard,sans-serif;white-space:nowrap;color:#161B20">${loc.name}</div>`,
          }).open(map, marker);
        }
      });
      if (!bounds.isEmpty()) {
        map.setBounds(bounds);
        if (found === 1) map.setLevel(4);
      }
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

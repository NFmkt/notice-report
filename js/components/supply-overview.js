// js/components/supply-overview.js

function sqmToPyeong(sqm) {
  return Math.round(sqm * 0.3025 * 10) / 10;
}

function parseAreaRange(areaRange) {
  if (!areaRange) return null;
  const match = areaRange.match(/([\d.]+)㎡~([\d.]+)㎡/);
  if (!match) return null;
  const minSqm = parseFloat(match[1]);
  const maxSqm = parseFloat(match[2]);
  return {
    minSqm, maxSqm,
    minPyeong: sqmToPyeong(minSqm),
    maxPyeong: sqmToPyeong(maxSqm),
  };
}

function renderDistrictChart(locations) {
  if (!locations || locations.length === 0) return '';
  const sorted = [...locations].sort((a, b) => b.units - a.units);
  const top = sorted.slice(0, 5);
  const maxUnits = top[0].units;
  const remaining = sorted.length - 5;

  if (locations.length === 1) {
    return `
      <div class="supply-single-district">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span class="supply-single-name">${locations[0].district} 단일 공급</span>
        <span class="supply-single-units">${locations[0].units}호</span>
      </div>`;
  }

  const bars = top.map(loc => `
    <div class="supply-bar-row">
      <span class="supply-bar-label">${loc.district}</span>
      <div class="supply-bar-track">
        <div class="supply-bar-fill" style="width:${Math.round((loc.units/maxUnits)*100)}%"></div>
      </div>
      <span class="supply-bar-val">${loc.units}</span>
    </div>
  `).join('');

  return `
    <div class="supply-bar-list">${bars}</div>
    ${remaining > 0 ? `<p class="supply-bar-note">외 ${remaining + (sorted.length > 5 ? sorted.length - 5 : 0)}개 자치구 포함</p>` : ''}
  `;
}

function renderHouseTypes(houseTypes) {
  if (!houseTypes || houseTypes.length === 0) return '';

  if (houseTypes.length === 1) {
    return `
      <div class="supply-solo-type">
        <span class="supply-solo-type-name">${houseTypes[0].type}</span>
        <span class="supply-solo-type-units">${houseTypes[0].units}호</span>
        <span class="supply-solo-type-badge">단일 유형</span>
      </div>`;
  }

  const pills = houseTypes.map(t => `
    <span class="supply-type-pill">${t.type}<span class="supply-type-pill-units">${t.units}</span></span>
  `).join('');
  return `<div class="supply-type-pills">${pills}</div>`;
}

export function renderSupplyOverview(data) {
  const { houseTypes, areaRange, locations } = data;
  const area = parseAreaRange(areaRange);
  const districtHtml = renderDistrictChart(locations);
  const typesHtml = renderHouseTypes(houseTypes);

  return `
    <div class="supply-overview-v2">
      <div class="supply-cols">
        <div class="supply-col-district">
          <p class="supply-col-title">모집호수</p>
          ${districtHtml}
        </div>
        <div class="supply-col-types">
          <p class="supply-col-title">주택 유형</p>
          ${typesHtml}
          ${area ? `
          <div class="supply-area-row">
            <span class="supply-area-sqm">${area.minSqm}~${area.maxSqm}㎡</span>
            <span class="supply-area-sep">·</span>
            <span class="supply-area-pyeong">${area.minPyeong}~${area.maxPyeong}평</span>
          </div>` : ''}
        </div>
      </div>
    </div>
  `;
}

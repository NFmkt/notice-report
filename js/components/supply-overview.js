// js/components/supply-overview.js
import { DISTRICT_CENTERS, SEOUL_OUTLINE } from './seoul-map.js';

function renderSinglePin(data) {
  const loc = data.locations[0];
  return `
    <div class="supply-single">
      <div class="supply-pin-card">
        <span class="supply-pin-icon">📍</span>
        <div>
          <p class="supply-pin-district">${loc.district}</p>
          <p class="supply-pin-units">${loc.units}호</p>
        </div>
      </div>
    </div>
  `;
}

function renderBubble(data) {
  const maxUnits = Math.max(...data.locations.map(l => l.units));
  const bubbles = data.locations.map(loc => {
    const center = DISTRICT_CENTERS[loc.district] || { cx: 250, cy: 275 };
    const r = 15 + (loc.units / maxUnits) * 35;
    return `
      <g class="bubble-group">
        <circle cx="${center.cx}" cy="${center.cy}" r="${r}"
          fill="var(--blue)" fill-opacity="0.25" stroke="var(--blue)" stroke-width="1.5"/>
        <text x="${center.cx}" y="${center.cy}" text-anchor="middle"
          dy="0.35em" font-size="11" fill="var(--blue)" font-weight="600">
          ${loc.units}
        </text>
        <text x="${center.cx}" y="${center.cy + r + 12}" text-anchor="middle"
          font-size="9" fill="var(--ink-muted)">
          ${loc.district}
        </text>
      </g>
    `;
  }).join('');
  return `
    <svg viewBox="0 0 500 550" class="supply-map-svg" aria-label="공급 위치 버블 차트">
      <path d="${SEOUL_OUTLINE}" fill="var(--surface)" stroke="var(--border)" stroke-width="1.5"/>
      ${bubbles}
    </svg>
  `;
}

function renderChoropleth(data) {
  const maxUnits = Math.max(...data.locations.map(l => l.units));
  const unitMap = Object.fromEntries(data.locations.map(l => [l.district, l.units]));
  const districtElements = Object.entries(DISTRICT_CENTERS).map(([name, center]) => {
    const units = unitMap[name] || 0;
    const intensity = units / maxUnits;
    const opacity = units > 0 ? 0.15 + intensity * 0.7 : 0.05;
    return `
      <g class="district-group">
        <circle cx="${center.cx}" cy="${center.cy}" r="18"
          fill="var(--blue)" fill-opacity="${opacity.toFixed(2)}"/>
        ${units > 0 ? `
          <text x="${center.cx}" y="${center.cy}" text-anchor="middle"
            dy="0.35em" font-size="9" fill="${intensity > 0.5 ? 'var(--bg)' : 'var(--blue)'}">
            ${units}
          </text>` : ''}
      </g>
    `;
  }).join('');
  return `
    <svg viewBox="0 0 500 550" class="supply-map-svg" aria-label="서울 자치구별 공급 물량">
      <path d="${SEOUL_OUTLINE}" fill="var(--surface)" stroke="var(--border)" stroke-width="1.5"/>
      ${districtElements}
    </svg>
  `;
}

export function renderSupplyOverview(data) {
  const { organizer, totalUnits, houseTypes, areaRange, locations } = data;

  const typesHtml = houseTypes.map(t => `
    <div class="supply-type-item">
      <span class="supply-type-name">${t.type}</span>
      <span class="supply-type-units">${t.units}호</span>
    </div>
  `).join('');

  let mapHtml;
  if (locations.length === 1) {
    mapHtml = renderSinglePin(data);
  } else if (locations.length <= 5) {
    mapHtml = renderBubble(data);
  } else {
    mapHtml = renderChoropleth(data);
  }

  return `
    <div class="supply-overview">
      <div class="supply-meta">
        <div class="supply-stat">
          <span class="supply-stat-label">공급기관</span>
          <span class="supply-stat-value">${organizer}</span>
        </div>
        <div class="supply-stat">
          <span class="supply-stat-label">총 모집 호수</span>
          <span class="supply-stat-value">${totalUnits.toLocaleString()}호</span>
        </div>
        ${areaRange ? `
        <div class="supply-stat">
          <span class="supply-stat-label">전용면적</span>
          <span class="supply-stat-value">${areaRange}</span>
        </div>` : ''}
      </div>
      <div class="supply-types">${typesHtml}</div>
      <div class="supply-map">${mapHtml}</div>
      ${locations.length > 1 ? `
      <div class="supply-location-table">
        <table>
          <thead><tr><th>지역</th><th>호수</th></tr></thead>
          <tbody>
            ${locations.map(l => `<tr><td>${l.district}</td><td>${l.units}호</td></tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}
    </div>
  `;
}

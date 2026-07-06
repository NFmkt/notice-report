// js/components/location-card.js

// 플랫 fill 아이콘 (icon-design 스킬 규칙: viewBox 0 0 20 20, stroke 금지, currentColor)
const PIN_SVG = `<svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 1.5c-3.3 0-6 2.6-6 5.9 0 4.2 5.2 10.4 5.4 10.7.3.4.9.4 1.2 0 .2-.3 5.4-6.5 5.4-10.7 0-3.3-2.7-5.9-6-5.9z" fill="currentColor"/><circle cx="10" cy="7.4" r="2.2" fill="#fff"/></svg>`;
// 지하철(전동차) 아이콘
const SUBWAY_SVG = `<svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3.5" y="2.3" width="13" height="12.4" rx="3.4" fill="currentColor"/><rect x="5.2" y="4.9" width="4" height="3.3" rx="1" fill="#fff"/><rect x="10.8" y="4.9" width="4" height="3.3" rx="1" fill="#fff"/><circle cx="6.6" cy="11.4" r="1.1" fill="#fff"/><circle cx="13.4" cy="11.4" r="1.1" fill="#fff"/><path d="M6.2 14.7 4.4 17c-.25.32 0 .7.4.7h1c.16 0 .3-.07.4-.2l1.7-2.8z" fill="currentColor"/><path d="M13.8 14.7 15.6 17c.25.32 0 .7-.4.7h-1c-.16 0-.3-.07-.4-.2l-1.7-2.8z" fill="currentColor"/></svg>`;

export function renderLocationCard(data) {
  const { locations = [] } = data;

  const cardsHtml = locations.map(loc => `
    <div class="loc-card">
      <div class="loc-card-header">
        <span class="loc-card-icon">${PIN_SVG}</span>
        <span class="loc-card-name">${loc.name}</span>
      </div>
      <div class="loc-card-body">
        <div class="loc-addr-block">
          <p class="loc-address">${loc.address}</p>
          ${loc.detail ? `<p class="loc-detail-line">${loc.detail}</p>` : ''}
        </div>
        ${loc.transit ? `<span class="loc-transit-chip">${SUBWAY_SVG}<span>${loc.transit}</span></span>` : ''}
      </div>
    </div>
  `).join('');

  const mapData = encodeURIComponent(JSON.stringify(
    locations.map(l => ({ name: l.name || '', address: l.address || '' }))
  ));

  return `
    <div class="loc-section">
      <p class="supply-col-title">위치</p>
      <div class="loc-card-list">${cardsHtml}</div>
      <div class="loc-map-container" data-locations="${mapData}"></div>
    </div>
  `;
}

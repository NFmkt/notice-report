// js/components/bullet-card.js
export function renderBulletCard(data) {
  const { groups } = data;
  const groupsHtml = groups.map(group => `
    <div class="bullet-group-row">
      <div class="bullet-group-head">
        <span class="bullet-group-label">${group.label}</span>
      </div>
      <ul class="bullet-list">
        ${group.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `).join('');
  return `<div class="bullet-card">${groupsHtml}</div>`;
}

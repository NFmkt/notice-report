// js/components/outro-block.js
import { ICONS } from '../icons.js';

export function renderOutroBlock(outro) {
  const { body, ctaLabel, ctaUrl } = outro;
  return `
    <div class="outro-block">
      <p class="outro-body">${body}</p>
      <a class="outro-cta" href="${ctaUrl}" target="_blank" rel="noopener">
        <span class="outro-cta-icon">${ICONS.lease}</span>
        ${ctaLabel}
      </a>
    </div>
  `;
}

// js/components/outro-block.js
import { ICONS } from '../icons.js';

export function renderOutroBlock(outro) {
  const { body, ctaLabel, ctaUrl } = outro;
  return `
    <div class="outro-block">
      <div class="outro-body">${body}</div>
      <div class="outro-cta-wrap">
        <a class="outro-cta" href="${ctaUrl}" target="_blank" rel="noopener">
          ${ctaLabel}
        </a>
      </div>
    </div>
  `;
}

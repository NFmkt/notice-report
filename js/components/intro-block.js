// js/components/intro-block.js
export function renderIntroBlock(intro) {
  const { headline, body } = intro;
  return `
    <div class="intro-block">
      <p class="intro-headline">"${headline}"</p>
      <div class="intro-body">${body}</div>
    </div>
  `;
}

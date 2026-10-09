import { assets } from '../data/assets';

export function sceneLayout(): string {
  return `
    <section class="game-shell" aria-label="CHANGE danfo journey">
      <div class="scene-topbar">
        <div>
          <p class="eyebrow">CHANGE / ROUTE 01</p>
          <h1>Oshodi to Ketu</h1>
        </div>
        <div class="route-sign" aria-label="Current route"><img src="${assets.routeSign}" alt="Oshodi to Ketu" /></div>
      </div>
      <div class="bus-scene" data-scene="bus-interior">
        <img class="bus-interior-art" src="${assets.busInterior}" alt="" aria-hidden="true" />
        <div class="bus-window window-left"></div>
        <div class="bus-window window-right"></div>
        <div class="bus-rail rail-one"></div>
        <div class="bus-rail rail-two"></div>
        <div class="bus-ceiling-light"></div>
        <div class="scene-label conductor-label">CONDUCTOR</div>
        <div class="conductor-seat" aria-hidden="true"><img src="${assets.conductor}" alt="" /><span>YOU</span></div>
        <img class="interior-poster" src="${assets.interiorPoster}" alt="" aria-hidden="true" />
        <div class="passenger-layer" data-passengers></div>
        <div class="bus-floor"></div>
      </div>
      <div data-hud></div>
      <div data-transaction></div>
      <div data-results></div>
    </section>
  `;
}

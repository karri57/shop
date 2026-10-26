class HomeCustomizer extends HTMLElement {
  connectedCallback() {
    this.events?.abort();
    this.events = new AbortController();
    try {
      const parsed = JSON.parse(this.querySelector('[data-hc-config]').textContent);
      this.config = {
        ...parsed,
        canvases: (parsed.canvases || []).filter(Boolean),
        designs: (parsed.designs || []).filter(Boolean),
      };
    } catch {
      return;
    }
    if (!this.config.canvases.length || !this.config.designs.length) return;
    this.state = { canvas: 0, design: 0, placement: 'center', x: 50, y: 42, scale: 0.9 };
    this.frame = this.querySelector('[data-hc-frame]');
    this.photo = this.querySelector('[data-hc-photo]');
    this.motif = this.querySelector('[data-hc-motif]');
    this.motifImage = this.querySelector('[data-hc-motif-image]');
    this.continueLink = this.querySelector('[data-hc-continue]');
    this.status = this.querySelector('[data-hc-status]');
    this.photo.dataset.canvas = this.config.canvases[0].key;
    this.querySelectorAll('[data-hc-control]').forEach((control) => { control.disabled = false; });
    const options = { signal: this.events.signal };
    this.addEventListener('click', (event) => this.handleClick(event), options);
    this.querySelector('[data-hc-size]').addEventListener('input', (event) => {
      this.state.scale = Number(event.target.value) / 100;
      this.render();
    }, options);
    this.motif.addEventListener('pointerdown', (event) => this.startDrag(event), options);
    this.motif.addEventListener('pointermove', (event) => this.moveDrag(event), options);
    this.motif.addEventListener('pointerup', () => this.endDrag(), options);
    this.motif.addEventListener('pointercancel', () => this.endDrag(), options);
    this.motif.addEventListener('lostpointercapture', () => this.endDrag(), options);
    this.motif.addEventListener('keydown', (event) => this.handleKey(event), options);
    this.motifImage.addEventListener('load', () => this.render(), options);
    this.render();
  }

  disconnectedCallback() {
    this.events?.abort();
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }

  handleClick(event) {
    const canvas = event.target.closest('[data-hc-canvas]');
    const design = event.target.closest('[data-hc-design]');
    const placement = event.target.closest('[data-hc-placement]');
    if (canvas) {
      const index = Number(canvas.dataset.hcCanvas);
      if (!this.config.canvases[index]) return;
      this.state.canvas = index;
    } else if (design) {
      this.state.design = design.dataset.hcDesign === 'none' ? null : Number(design.dataset.hcDesign);
    } else if (placement) {
      const chest = placement.dataset.hcPlacement === 'chest';
      Object.assign(this.state, {
        placement: chest ? 'chest' : 'center',
        x: chest ? 62 : 50,
        y: chest ? 36 : 42,
        scale: chest ? 0.45 : 0.9,
      });
    } else if (event.target.closest('[data-hc-reset]')) {
      Object.assign(this.state, { design: 0, placement: 'center', x: 50, y: 42, scale: 0.9 });
    } else {
      return;
    }
    this.render();
    this.announce();
  }

  constrain() {
    const width = 24 * this.state.scale;
    const ratio = this.motifImage.naturalWidth / this.motifImage.naturalHeight || 1;
    const height = width * this.config.canvases[this.state.canvas].ratio / ratio;
    this.state.x = Math.max(25 + width / 2, Math.min(75 - width / 2, this.state.x));
    this.state.y = Math.max(25 + height / 2, Math.min(70 - height / 2, this.state.y));
  }

  startDrag(event) {
    if (event.button !== 0 || this.state.design === null) return;
    event.preventDefault();
    this.motif.focus({ preventScroll: true });
    this.motif.setPointerCapture(event.pointerId);
    this.drag = {
      pointer: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: this.state.x,
      y: this.state.y,
      rect: this.frame.getBoundingClientRect(),
    };
    this.motif.dataset.dragging = '';
  }

  moveDrag(event) {
    if (!this.drag || this.drag.pointer !== event.pointerId) return;
    this.state.x = this.drag.x + (event.clientX - this.drag.clientX) / this.drag.rect.width * 100;
    this.state.y = this.drag.y + (event.clientY - this.drag.clientY) / this.drag.rect.height * 100;
    this.state.placement = 'custom';
    if (this.animationFrame) return;
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = null;
      this.render();
    });
  }

  endDrag() {
    if (!this.drag) return;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    const pointer = this.drag.pointer;
    this.drag = null;
    delete this.motif.dataset.dragging;
    if (this.motif.hasPointerCapture(pointer)) this.motif.releasePointerCapture(pointer);
    this.render();
    this.announce();
  }

  handleKey(event) {
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!directions[event.key]) return;
    event.preventDefault();
    const amount = event.shiftKey ? 5 : 1;
    this.state.x += directions[event.key][0] * amount;
    this.state.y += directions[event.key][1] * amount;
    this.state.placement = 'custom';
    this.render();
    this.announce();
  }

  render() {
    const canvas = this.config.canvases[this.state.canvas];
    const design = this.config.designs[this.state.design];
    this.constrain();
    if (this.photo.dataset.canvas !== canvas.key) {
      this.photo.dataset.canvas = canvas.key;
      this.photo.removeAttribute('srcset');
      this.photo.removeAttribute('sizes');
      this.photo.width = 900;
      this.photo.height = Math.round(900 / canvas.ratio);
      this.photo.src = canvas.src;
    }
    this.photo.alt = canvas.label;
    this.frame.style.setProperty('--hc-ratio', String(canvas.ratio));
    this.querySelector('[data-hc-product-name]').textContent = canvas.label;
    this.querySelector('[data-hc-price]').textContent = canvas.price || '—';
    this.querySelector('[data-hc-availability]').textContent = canvas.available
      ? this.config.strings.available : this.config.strings.soldOut;
    this.querySelectorAll('[data-hc-canvas]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.hcCanvas) === this.state.canvas));
    });
    this.querySelectorAll('[data-hc-design]').forEach((button) => {
      const index = button.dataset.hcDesign === 'none' ? null : Number(button.dataset.hcDesign);
      button.setAttribute('aria-pressed', String(index === this.state.design));
    });
    this.querySelectorAll('[data-hc-placement]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.hcPlacement === this.state.placement));
    });
    this.querySelector('[data-hc-placement-controls]').hidden = !design;
    this.motif.hidden = !design;
    if (design) {
      if (this.motifImage.getAttribute('src') !== design.src) this.motifImage.src = design.src;
      this.motifImage.alt = design.label;
      this.motif.setAttribute('aria-label', design.label + '. ' + this.config.strings.moveMotif);
      this.motif.style.left = this.state.x + '%';
      this.motif.style.top = this.state.y + '%';
      this.motif.style.width = (24 * this.state.scale) + '%';
    }
    const size = Math.round(this.state.scale * 100);
    this.querySelector('[data-hc-size]').value = String(size);
    this.querySelector('[data-hc-size-output]').textContent = size + '%';
    const url = new URL(this.config.studioUrl, window.location.origin);
    url.searchParams.set('canvas', canvas.key);
    url.searchParams.set('motif', design?.key || 'none');
    if (canvas.colorway) url.searchParams.set('colorway', canvas.colorway);
    if (design) {
      url.searchParams.set('x', this.state.x.toFixed(2));
      url.searchParams.set('y', this.state.y.toFixed(2));
      url.searchParams.set('scale', this.state.scale.toFixed(2));
    }
    this.continueLink.href = url.href;
  }

  announce() {
    const canvas = this.config.canvases[this.state.canvas];
    const design = this.config.designs[this.state.design];
    this.status.textContent = canvas.label + ' · ' + (design?.label || this.config.strings.noMotif);
  }
}

if (!customElements.get('home-customizer')) customElements.define('home-customizer', HomeCustomizer);

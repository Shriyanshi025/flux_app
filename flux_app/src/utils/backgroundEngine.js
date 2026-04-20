import { state } from '../core/state.js';

export const backgroundEngine = {
  init: () => {
    if (state.p5Instance) return;

    if (typeof p5 === 'undefined') {
      console.warn('P5.js not detected. Background engine disabled.');
      return;
    }

    const sketch = (p) => {
      const opt = {
        particles: (p.windowWidth / 500) > 1 ? 1000 : 500,
        noiseScale: 0.009,
        angle: p.PI / 180 * -90,
        h1: Math.floor(Math.random() * 360), h2: Math.floor(Math.random() * 360),
        s1: 60, s2: 70,
        l1: 50, l2: 60,
        strokeWeight: 1.2,
        tail: 82,
      };

      const Particles = [];
      let time = 0;

      class Particle {
        constructor(x, y) {
          this.x = x; this.y = y;
          this.lx = x; this.ly = y;
          this.vx = 0; this.vy = 0;
          this.ax = 0; this.ay = 0;
          this.randomize();
        }
        randomize() {
          this.hue = Math.random() > 0.5 ? opt.h1 : opt.h2;
          this.maxSpeed = Math.random() > 0.5 ? 3 : 2;
        }
        update() {
          const angle = p.noise(this.x * opt.noiseScale, this.y * opt.noiseScale, time * opt.noiseScale) * p.PI * 0.5 + opt.angle;
          this.ax += p.cos(angle);
          this.ay += p.sin(angle);
          this.vx += this.ax; this.vy += this.ay;
          const mag = p.sqrt(this.vx * this.vx + this.vy * this.vy);
          const a = p.atan2(this.vy, this.vx);
          const m = p.min(this.maxSpeed, mag);
          this.vx = p.cos(a) * m;
          this.vy = p.sin(a) * m;
          this.x += this.vx; this.y += this.vy;
          this.ax = 0; this.ay = 0;
          this.edges();
        }
        edges() {
          if (this.x < 0) { this.x = p.width; this.lx = this.x; }
          if (this.x > p.width) { this.x = 0; this.lx = this.x; }
          if (this.y < 0) { this.y = p.height; this.ly = this.y; }
          if (this.y > p.height) { this.y = 0; this.ly = this.y; }
        }
        render() {
          p.stroke(`hsla(${this.hue}, 70%, 50%, .5)`);
          p.line(this.x, this.y, this.lx, this.ly);
          this.lx = this.x; this.ly = this.y;
        }
      }

      p.setup = () => {
        const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
        cnv.id('flux-bg-canvas');
        cnv.style('position', 'fixed');
        cnv.style('top', '0'); cnv.style('left', '0');
        cnv.style('z-index', '-1');
        cnv.style('opacity', state.bgShouldBeWaking ? '1' : '0');
        cnv.style('transition', 'opacity 1s ease');
        cnv.style('pointer-events', 'none');

        for (let i = 0; i < opt.particles; i++) {
          Particles.push(new Particle(Math.random() * p.width, Math.random() * p.height));
        }
        p.strokeWeight(opt.strokeWeight);
        if (!state.bgShouldBeWaking) p.noLoop();
      };

      p.draw = () => {
        time++;
        p.background(0, 100 - opt.tail);
        for (let part of Particles) {
          part.update();
          part.render();
        }
      };

      p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
      
      p.wake = () => {
        const el = document.getElementById('flux-bg-canvas');
        if (el) el.style.opacity = '1';
        p.loop();
      };

      p.hibernate = () => {
        const el = document.getElementById('flux-bg-canvas');
        if (el) el.style.opacity = '0';
        p.noLoop();
      };
    };

    state.p5Instance = new p5(sketch);
  },

  wake: () => {
    state.bgShouldBeWaking = true;
    state.p5Instance?.wake();
  },

  hibernate: () => {
    state.bgShouldBeWaking = false;
    state.p5Instance?.hibernate();
  }
};

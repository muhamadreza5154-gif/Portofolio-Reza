"use client";

import * as React from "react";
import {
  animate,
  motionValue,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";

const CELL = 14;
const RELAX = 2;
const MIN_CANVAS_FRAME_MS = 50;
const MIN_GL_IDLE_MS = 50;
const MIN_GL_ACTIVE_MS = 16;
const GL_RENDER_SCALE = 0.85;
const MAX_DPR = 1;
const FEATURE = 280;
const RANGE = 0.95;
const HILL_RADIUS = 90;
const RIPPLE_WIDTH = 60;

const PERMUTATION = (() => {
  const table = Array.from({ length: 256 }, (_, i) => i);
  let seed = 1013;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [table[i], table[j]] = [table[j], table[i]];
  }
  return Uint8Array.from([...table, ...table]);
})();

function usePageVisible() {
  const [visible, setVisible] = React.useState(() =>
    typeof document === "undefined" ? true : document.visibilityState !== "hidden"
  );

  React.useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return visible;
}

function setMotionImmediate(mv, val) {
  if (typeof mv.jump === "function") mv.jump(val);
  else mv.set(val);
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function noise(x, y, z) {
  const p = PERMUTATION;
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = p[X] + Y;
  const AA = p[A] + Z;
  const AB = p[A + 1] + Z;
  const B = p[X + 1] + Y;
  const BA = p[B] + Z;
  const BB = p[B + 1] + Z;
  return lerp(
    lerp(
      lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
      lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u),
      v
    ),
    lerp(
      lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
      lerp(
        grad(p[AB + 1], x, y - 1, z - 1),
        grad(p[BB + 1], x - 1, y - 1, z - 1),
        u
      ),
      v
    ),
    w
  );
}

function createContours(edges) {
  return {
    segments: new Float64Array(0),
    count: 0,
    used: new Uint8Array(0),
    first: new Int32Array(edges).fill(-1),
    second: new Int32Array(edges).fill(-1),
    points: new Float64Array(0),
    scratch: new Float64Array(0),
  };
}

function addSegment(c, edgeA, xA, yA, edgeB, xB, yB) {
  if ((c.count + 1) * 6 > c.segments.length) {
    const capacity = Math.max(256, c.count * 2);
    const segments = new Float64Array(capacity * 6);
    segments.set(c.segments);
    c.segments = segments;
    c.used = new Uint8Array(capacity);
    c.points = new Float64Array(capacity * 4 + 16);
    c.scratch = new Float64Array(capacity * 4 + 16);
  }
  const o = c.count * 6;
  const s = c.segments;
  s[o] = edgeA;
  s[o + 1] = xA;
  s[o + 2] = yA;
  s[o + 3] = edgeB;
  s[o + 4] = xB;
  s[o + 5] = yB;
  c.count++;
}

function link(c, edge, segment) {
  if (c.first[edge] < 0) c.first[edge] = segment;
  else c.second[edge] = segment;
}

function neighbour(c, edge, segment) {
  const a = c.first[edge];
  const next = a === segment ? c.second[edge] : a;
  return next >= 0 && !c.used[next] ? next : -1;
}

function relax(pts, start, n, closed, scratch) {
  for (let pass = 0; pass < RELAX; pass++) {
    scratch.set(pts.subarray(start, start + n * 2));
    for (let i = closed ? 0 : 1; i < (closed ? n : n - 1); i++) {
      const a = ((i - 1 + n) % n) * 2;
      const b = ((i + 1) % n) * 2;
      pts[start + i * 2] =
        (scratch[a] + 2 * scratch[i * 2] + scratch[b]) / 4;
      pts[start + i * 2 + 1] =
        (scratch[a + 1] + 2 * scratch[i * 2 + 1] + scratch[b + 1]) / 4;
    }
  }
}

function atIndex(pts, start, n, i) {
  return start + ((i + n) % n) * 2;
}

function smooth(path, pts, start, end, closed, scratch) {
  const n = (end - start) / 2;
  if (n < 2) return;
  if (n > 3) relax(pts, start, n, closed, scratch);
  if (closed && n > 2) {
    const last = atIndex(pts, start, n, -1);
    path.moveTo(
      (pts[last] + pts[start]) / 2,
      (pts[last + 1] + pts[start + 1]) / 2
    );
    for (let i = 0; i < n; i++) {
      const p = atIndex(pts, start, n, i);
      const q = atIndex(pts, start, n, i + 1);
      path.quadraticCurveTo(
        pts[p],
        pts[p + 1],
        (pts[p] + pts[q]) / 2,
        (pts[p + 1] + pts[q + 1]) / 2
      );
    }
    return;
  }
  path.moveTo(pts[start], pts[start + 1]);
  for (let i = 1; i < n - 1; i++) {
    const p = start + i * 2;
    path.quadraticCurveTo(
      pts[p],
      pts[p + 1],
      (pts[p] + pts[p + 2]) / 2,
      (pts[p + 1] + pts[p + 3]) / 2
    );
  }
  path.lineTo(pts[end - 2], pts[end - 1]);
}

function traceLevel(path, c) {
  const s = c.segments;
  const pts = c.points;
  for (let i = 0; i < c.count; i++) {
    c.used[i] = 0;
    link(c, s[i * 6], i);
    link(c, s[i * 6 + 3], i);
  }
  const middle = (pts.length >> 2) << 1;
  for (let start = 0; start < c.count; start++) {
    if (c.used[start]) continue;
    c.used[start] = 1;
    const o = start * 6;
    let head = middle;
    let tail = middle;
    pts[tail++] = s[o + 1];
    pts[tail++] = s[o + 2];
    pts[tail++] = s[o + 4];
    pts[tail++] = s[o + 5];
    let current = start;
    let edge = s[o + 3];
    for (;;) {
      const next = neighbour(c, edge, current);
      if (next < 0) break;
      c.used[next] = 1;
      const n = next * 6;
      const far = s[n] === edge ? 3 : 0;
      pts[tail++] = s[n + far + 1];
      pts[tail++] = s[n + far + 2];
      edge = s[n + far];
      current = next;
    }
    const closed = edge === s[o] && tail - head > 6;
    if (closed) tail -= 2;
    else {
      current = start;
      edge = s[o];
      for (;;) {
        const next = neighbour(c, edge, current);
        if (next < 0) break;
        c.used[next] = 1;
        const n = next * 6;
        const far = s[n] === edge ? 3 : 0;
        pts[--head] = s[n + far + 2];
        pts[--head] = s[n + far + 1];
        edge = s[n + far];
        current = next;
      }
    }
    smooth(path, pts, head, tail, closed, c.scratch);
  }
  for (let i = 0; i < c.count; i++) {
    const from = s[i * 6];
    const to = s[i * 6 + 3];
    c.first[from] = c.second[from] = -1;
    c.first[to] = c.second[to] = -1;
  }
  c.count = 0;
}

const VERTEX = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 size;
uniform float dpr;
uniform float feature;
uniform float z;
uniform float step;
uniform float range;
uniform float amount;
uniform float lift;
uniform float hillRadius;
uniform vec2 hill;
uniform vec4 ripples[4];
uniform float reach;
uniform float rippleWidth;
uniform vec3 color;
uniform float lineOpacity;

vec3 mod289v(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

float mod289f(float x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

float perm(float x) {
  return mod289f(((x * 34.0) + 10.0) * x);
}

float grad(float hash, float x, float y, float z) {
  float h = floor(fract(hash * (1.0 / 16.0)) * 16.0);
  float u = h < 8.0 ? x : y;
  float v = h < 4.0 ? y : (h == 12.0 || h == 14.0 ? x : z);
  float s1 = fract(h * 0.5) < 0.25 ? u : -u;
  float s2 = fract(floor(h * 0.5) * 0.5) < 0.25 ? v : -v;
  return s1 + s2;
}

float noise(vec3 p) {
  vec3 cell = mod289v(floor(p));
  vec3 f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float A = perm(cell.x) + cell.y;
  float AA = perm(A) + cell.z;
  float AB = perm(A + 1.0) + cell.z;
  float B = perm(cell.x + 1.0) + cell.y;
  float BA = perm(B) + cell.z;
  float BB = perm(B + 1.0) + cell.z;
  return mix(
    mix(
      mix(grad(perm(AA), f.x, f.y, f.z), grad(perm(BA), f.x - 1.0, f.y, f.z), u.x),
      mix(grad(perm(AB), f.x, f.y - 1.0, f.z), grad(perm(BB), f.x - 1.0, f.y - 1.0, f.z), u.x),
      u.y
    ),
    mix(
      mix(grad(perm(AA + 1.0), f.x, f.y, f.z - 1.0), grad(perm(BA + 1.0), f.x - 1.0, f.y, f.z - 1.0), u.x),
      mix(grad(perm(AB + 1.0), f.x, f.y - 1.0, f.z - 1.0), grad(perm(BB + 1.0), f.x - 1.0, f.y - 1.0, f.z - 1.0), u.x),
      u.y
    ),
    u.z
  );
}

void main() {
  vec2 point = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y) / dpr;
  vec2 n = point / feature;
  float value = noise(vec3(n, z)) * 1.1 + noise(vec3(n * 2.1, z * 1.7)) * 0.45;
  if (lift > 0.0) value += lift * exp(-length(point - hill) / hillRadius);
  for (int i = 0; i < 4; i++) {
    vec4 ripple = ripples[i];
    if (ripple.w > 0.5) {
      float d = length(point - ripple.xy) - ripple.z * reach;
      value += 0.9 * (1.0 - ripple.z) * cos(d / rippleWidth * 1.8) * exp(-(d * d) / (2.0 * rippleWidth * rippleWidth));
    }
  }
  value *= amount;
  float level = (value + range) / step;
  float nearest = floor(level + 0.5);
  float slope = length(vec2(dFdx(level), dFdy(level)));
  float pixels = abs(level - nearest) / max(slope, 1e-6);
  bool major = mod(nearest, 5.0) == 0.0;
  float width = max(1.0, (major ? 1.5 : 1.0) * dpr);
  float alpha = slope > 1e-6 ? clamp(width * 0.5 + 0.5 - pixels, 0.0, 1.0) * (major ? 0.85 : 0.4) * lineOpacity : 0.0;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function createGlRenderer(gl) {
  if (!gl.getExtension("OES_standard_derivatives")) return null;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const loc = (name) => gl.getUniformLocation(program, name);
  const uniforms = {
    size: loc("size"),
    dpr: loc("dpr"),
    feature: loc("feature"),
    z: loc("z"),
    step: loc("step"),
    range: loc("range"),
    amount: loc("amount"),
    lift: loc("lift"),
    hillRadius: loc("hillRadius"),
    hill: loc("hill"),
    ripples: loc("ripples"),
    reach: loc("reach"),
    rippleWidth: loc("rippleWidth"),
    color: loc("color"),
    lineOpacity: loc("lineOpacity"),
  };
  gl.uniform1f(uniforms.range, RANGE);
  gl.uniform1f(uniforms.hillRadius, HILL_RADIUS);
  gl.uniform1f(uniforms.rippleWidth, RIPPLE_WIDTH);

  const renderFrame = (frameData) => {
    const w = Math.max(1, Math.round(frameData.width * frameData.dpr));
    const h = Math.max(1, Math.round(frameData.height * frameData.dpr));
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uniforms.size, w, h);
    gl.uniform1f(uniforms.dpr, frameData.dpr);
    gl.uniform1f(uniforms.feature, frameData.feature);
    gl.uniform1f(uniforms.z, frameData.z);
    gl.uniform1f(uniforms.step, frameData.step);
    gl.uniform1f(uniforms.amount, frameData.amount);
    gl.uniform1f(uniforms.lift, frameData.lift);
    gl.uniform2f(uniforms.hill, frameData.hill[0], frameData.hill[1]);
    gl.uniform4fv(uniforms.ripples, frameData.ripples);
    gl.uniform1f(uniforms.reach, frameData.reach);
    gl.uniform3f(uniforms.color, frameData.color[0], frameData.color[1], frameData.color[2]);
    gl.uniform1f(uniforms.lineOpacity, frameData.lineOpacity);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  renderFrame.dispose = () => {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
  };

  return renderFrame;
}

let sharedProbeCtx = null;
function toRgb(color) {
  if (typeof document === "undefined") return [0.45, 0.45, 0.45];
  if (!sharedProbeCtx) {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    sharedProbeCtx = c.getContext("2d", { willReadFrequently: true });
  }
  if (!sharedProbeCtx) return [0.45, 0.45, 0.45];
  sharedProbeCtx.clearRect(0, 0, 1, 1);
  sharedProbeCtx.fillStyle = color;
  sharedProbeCtx.fillRect(0, 0, 1, 1);
  const data = sharedProbeCtx.getImageData(0, 0, 1, 1).data;
  return [data[0] / 255, data[1] / 255, data[2] / 255];
}

const TopographyBackground = React.forwardRef(function TopographyBackground(
  {
    lineColor,
    lineOpacity = 1,
    levels = 14,
    speed = 0.85,
    scale = 1,
    peak = 0.85,
    interactive = true,
    paused = false,
    transition = { stiffness: 120, damping: 22 },
    className,
    children,
    ...props
  },
  forwardedRef
) {
  const containerRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  React.useImperativeHandle(forwardedRef, () => containerRef.current);

  const inView = useInView(containerRef, { margin: "0px" });
  const pageVisible = usePageVisible();
  const reduce = useReducedMotion();
  const playing = inView && pageVisible && !reduce && !paused;

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const raised = useMotionValue(0);
  const hillX = useSpring(pointerX, transition);
  const hillY = useSpring(pointerY, transition);
  const hill = useSpring(raised, { stiffness: 80, damping: 20 });
  const rise = useMotionValue(1);
  const ripplesRef = React.useRef([]);
  const drawRef = React.useRef(() => {});
  const timeRef = React.useRef(0);
  const isGlRef = React.useRef(false);
  const scrollingRef = React.useRef(false);

  const options = { lineColor, lineOpacity, levels, speed, scale, peak };
  const optionsRef = React.useRef(options);
  React.useLayoutEffect(() => {
    optionsRef.current = options;
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext("webgl", {
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      antialias: false,
    });
    const render = gl ? createGlRenderer(gl) : null;
    if (render) {
      isGlRef.current = true;
      let width = 0;
      let height = 0;
      let dpr = 1;
      let frames = 0;
      let textColor = "";
      let rgb = [0.45, 0.45, 0.45];
      const ripples = new Float32Array(16);

      const resize = () => {
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR) * GL_RENDER_SCALE;
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        if (hill.get() === 0) {
          setMotionImmediate(pointerX, width / 2);
          setMotionImmediate(pointerY, height / 2);
          setMotionImmediate(hillX, width / 2);
          setMotionImmediate(hillY, height / 2);
        }
      };

      const draw = (time, looping = false) => {
        if (width === 0 || height === 0) return;
        const {
          lineColor: lc,
          lineOpacity: lo,
          levels: lv,
          speed: sp,
          scale: sc,
          peak: pk,
        } = optionsRef.current;
        if (!looping || frames++ % 30 === 0) {
          const color = lc ?? (getComputedStyle(container).color || "#737373");
          if (color !== textColor) {
            textColor = color;
            rgb = toRgb(color);
          }
        }
        ripples.fill(0);
        ripplesRef.current.slice(-4).forEach((ripple, i) => {
          ripples[i * 4] = ripple.x;
          ripples[i * 4 + 1] = ripple.y;
          ripples[i * 4 + 2] = ripple.progress.get();
          ripples[i * 4 + 3] = 1;
        });
        render({
          width,
          height,
          dpr,
          feature: FEATURE * sc,
          z: time * 0.00005 * sp,
          step: (2 * RANGE) / Math.max(2, Math.round(lv)),
          amount: rise.get(),
          lift: hill.get() * pk * 1.5,
          hill: [hillX.get(), hillY.get()],
          ripples,
          reach: Math.hypot(width, height) * 0.8,
          color: rgb,
          lineOpacity: lo ?? 1,
        });
      };

      drawRef.current = draw;
      resize();
      draw(timeRef.current);
      const observer = new ResizeObserver(() => {
        resize();
        draw(timeRef.current);
      });
      observer.observe(container);
      return () => {
        observer.disconnect();
        render.dispose?.();
        drawRef.current = () => {};
      };
    }

    isGlRef.current = false;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let field = new Float32Array(0);
    let levelLow = new Int16Array(0);
    let levelHigh = new Int16Array(0);
    let bucketStart = new Int32Array(0);
    let bucketCells = new Int32Array(0);
    let contours = createContours(0);
    let frames = 0;
    let textColor = "#737373";

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, MAX_DPR));
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      cols = Math.ceil(width / CELL) + 1;
      rows = Math.ceil(height / CELL) + 1;
      field = new Float32Array((cols + 1) * (rows + 1));
      levelLow = new Int16Array(rows * cols);
      levelHigh = new Int16Array(rows * cols);
      contours = createContours(2 * (rows + 1) * (cols + 1) + 4);
      if (hill.get() === 0) {
        setMotionImmediate(pointerX, width / 2);
        setMotionImmediate(pointerY, height / 2);
        setMotionImmediate(hillX, width / 2);
        setMotionImmediate(hillY, height / 2);
      }
    };

    const sample = (time) => {
      const { speed: sp, scale: sc, peak: pk } = optionsRef.current;
      const size = FEATURE * sc;
      const z = time * 0.00005 * sp;
      const lift = hill.get() * pk * 1.5;
      const hx = hillX.get();
      const hy = hillY.get();
      const ripples = ripplesRef.current;
      const reach = Math.hypot(width, height) * 0.8;
      const amount = rise.get();
      let i = 0;
      for (let row = 0; row <= rows; row++) {
        const y = row * CELL;
        for (let col = 0; col <= cols; col++) {
          const x = col * CELL;
          const nx = x / size;
          const ny = y / size;
          let value =
            noise(nx, ny, z) * 1.1 + noise(nx * 2.1, ny * 2.1, z * 1.7) * 0.45;
          const dx = x - hx;
          const dy = y - hy;
          if (lift > 0)
            value += lift * Math.exp(-Math.hypot(dx, dy) / HILL_RADIUS);
          for (const ripple of ripples) {
            const p = ripple.progress.get();
            const d = Math.hypot(x - ripple.x, y - ripple.y) - p * reach;
            value +=
              0.9 *
              (1 - p) *
              Math.cos((d / RIPPLE_WIDTH) * 1.8) *
              Math.exp(-(d * d) / (2 * RIPPLE_WIDTH * RIPPLE_WIDTH));
          }
          field[i++] = value * amount;
        }
      }
    };

    const draw = (time, looping = false) => {
      if (width === 0 || height === 0) return;
      const { lineColor: lc, lineOpacity: lo = 1, levels: lv } = optionsRef.current;
      sample(time);
      const count = Math.max(2, Math.round(lv));
      const step = (2 * RANGE) / count;
      const minor = new Path2D();
      const major = new Path2D();
      const stride = cols + 1;
      let lowest = Infinity;
      let highest = -Infinity;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * stride + col;
          const a = field[i];
          const b = field[i + 1];
          const c = field[i + stride + 1];
          const d = field[i + stride];
          const first = Math.ceil((Math.min(a, b, c, d) + RANGE) / step);
          const last = Math.floor((Math.max(a, b, c, d) + RANGE) / step);
          levelLow[row * cols + col] = first;
          levelHigh[row * cols + col] = last;
          if (first < lowest) lowest = first;
          if (last > highest) highest = last;
        }
      }

      const span = highest - lowest + 1;
      if (span <= 0 || !Number.isFinite(span)) return;
      if (bucketStart.length < span + 1) bucketStart = new Int32Array(span + 1);
      bucketStart.fill(0, 0, span + 1);
      let entries = 0;
      for (let cell = 0; cell < rows * cols; cell++) {
        for (let level = levelLow[cell]; level <= levelHigh[cell]; level++) {
          bucketStart[level - lowest + 1]++;
          entries++;
        }
      }
      for (let l = 0; l < span; l++) bucketStart[l + 1] += bucketStart[l];
      if (bucketCells.length < entries)
        bucketCells = new Int32Array(entries * 2);
      const fill = bucketStart.slice(0, span);
      for (let cell = 0; cell < rows * cols; cell++) {
        for (let level = levelLow[cell]; level <= levelHigh[cell]; level++) {
          bucketCells[fill[level - lowest]++] = cell;
        }
      }

      for (let level = lowest; level <= highest; level++) {
        const v = level * step - RANGE;
        const end = bucketStart[level - lowest + 1];
        for (let e = bucketStart[level - lowest]; e < end; e++) {
          const cell = bucketCells[e];
          const row = (cell / cols) | 0;
          const col = cell - row * cols;
          const i = row * stride + col;
          const a = field[i];
          const b = field[i + 1];
          const c = field[i + stride + 1];
          const d = field[i + stride];
          const code =
            (a > v ? 8 : 0) |
            (b > v ? 4 : 0) |
            (c > v ? 2 : 0) |
            (d > v ? 1 : 0);
          if (code === 0 || code === 15) continue;
          const x = col * CELL;
          const y = row * CELL;
          const top = x + ((v - a) / (b - a)) * CELL;
          const right = y + ((v - b) / (c - b)) * CELL;
          const bottom = x + ((v - d) / (c - d)) * CELL;
          const left = y + ((v - a) / (d - a)) * CELL;
          const T = i * 2;
          const B = T + stride * 2;
          const L = T + 1;
          const R = T + 3;
          const k = contours;
          switch (code) {
            case 1:
            case 14:
              addSegment(k, L, x, left, B, bottom, y + CELL);
              break;
            case 2:
            case 13:
              addSegment(k, B, bottom, y + CELL, R, x + CELL, right);
              break;
            case 3:
            case 12:
              addSegment(k, L, x, left, R, x + CELL, right);
              break;
            case 4:
            case 11:
              addSegment(k, T, top, y, R, x + CELL, right);
              break;
            case 6:
            case 9:
              addSegment(k, T, top, y, B, bottom, y + CELL);
              break;
            case 7:
            case 8:
              addSegment(k, L, x, left, T, top, y);
              break;
            case 5:
            case 10: {
              const center = (a + b + c + d) / 4 > v;
              if ((code === 5) === center) {
                addSegment(k, L, x, left, T, top, y);
                addSegment(k, B, bottom, y + CELL, R, x + CELL, right);
              } else {
                addSegment(k, L, x, left, B, bottom, y + CELL);
                addSegment(k, T, top, y, R, x + CELL, right);
              }
              break;
            }
          }
        }
        traceLevel(level % 5 === 0 ? major : minor, contours);
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      if (!looping || frames++ % 30 === 0)
        textColor = getComputedStyle(container).color || "#737373";
      context.strokeStyle = lc ?? textColor;
      context.lineCap = "round";
      context.globalAlpha = 0.4 * lo;
      context.lineWidth = 1;
      context.stroke(minor);
      context.globalAlpha = 0.85 * lo;
      context.lineWidth = 1.5;
      context.stroke(major);
      context.globalAlpha = 1;
    };

    drawRef.current = draw;
    resize();
    draw(timeRef.current);
    const observer = new ResizeObserver(() => {
      resize();
      draw(timeRef.current);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      drawRef.current = () => {};
    };
  }, [hill, hillX, hillY, pointerX, pointerY, rise]);

  React.useEffect(() => {
    drawRef.current(timeRef.current);
  }, [lineColor, lineOpacity, levels, scale, peak]);

  // Passive zero-reflow window pointer tracking while visible & interactive
  React.useEffect(() => {
    if (!playing || !interactive) {
      raised.set(0);
      return;
    }
    let pendingMove = false;
    let clientX = 0;
    let clientY = 0;
    let rafId = 0;

    const flushPointer = () => {
      rafId = 0;
      if (!pendingMove || !containerRef.current) return;
      pendingMove = false;
      const rect = containerRef.current.getBoundingClientRect();
      const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;
      if (inside) {
        pointerX.set(clientX - rect.left);
        pointerY.set(clientY - rect.top);
        raised.set(1);
      } else {
        raised.set(0);
      }
    };

    const onMove = (e) => {
      if (e.pointerType === "touch") return;
      clientX = e.clientX;
      clientY = e.clientY;
      pendingMove = true;
      if (!rafId) rafId = requestAnimationFrame(flushPointer);
    };

    const onDown = (e) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pointerX.set(x);
      pointerY.set(y);
      const ripple = { x, y, progress: motionValue(0) };
      ripplesRef.current = [...ripplesRef.current.slice(-3), ripple];
      const controls = animate(ripple.progress, 1, {
        duration: 2.4,
        ease: [0.25, 0.4, 0.45, 1],
      });
      controls.then?.(() => {
        ripplesRef.current = ripplesRef.current.filter((r) => r !== ripple);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [playing, interactive, pointerX, pointerY, raised]);

  // Adaptive frame loop: pauses idle drift while scrolling so scroll compositing costs 0ms
  React.useEffect(() => {
    if (!playing) return;
    let rafId = 0;
    let scrollTimer = 0;
    let lastTime = performance.now();
    let waited = 0;

    const onScroll = () => {
      scrollingRef.current = true;
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        scrollingRef.current = false;
        lastTime = performance.now();
      }, 140);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const loop = (now) => {
      const delta = now - lastTime;
      lastTime = now;

      const isActive =
        hill.get() > 0.02 ||
        ripplesRef.current.length > 0 ||
        rise.get() < 0.99;

      // Skip background shader redraws while the page is actively scrolling
      if (scrollingRef.current && !isActive) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      waited += delta;
      const minInterval = isGlRef.current
        ? isActive
          ? MIN_GL_ACTIVE_MS
          : MIN_GL_IDLE_MS
        : MIN_CANVAS_FRAME_MS;

      if (waited >= minInterval) {
        timeRef.current += Math.min(waited, 64);
        waited = 0;
        drawRef.current(timeRef.current, true);
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      if (scrollTimer) window.clearTimeout(scrollTimer);
      window.removeEventListener("scroll", onScroll);
      scrollingRef.current = false;
    };
  }, [playing, hill, rise]);

  return (
    <div
      ref={containerRef}
      data-slot="topography-background"
      className={cn("relative w-full h-full overflow-hidden", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />
      {children}
    </div>
  );
});

export { TopographyBackground };
export default TopographyBackground;

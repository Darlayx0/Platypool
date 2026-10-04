// Hand-Sculpted Clay Geometry Builders
// All builders produce geometry oriented for a side-scroller: nose = +X, up = +Y, depth/span = Z.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

/**
 * Collects static parts and merges them per-material into a handful of meshes,
 * keeping draw calls low even with dozens of detailed clay pieces per model.
 */
export class PartBuilder {
  constructor() {
    this.buckets = new Map(); // material -> geometries[]
  }

  /** add(geo, mat, [x,y,z], [rx,ry,rz], [sx,sy,sz] | number) */
  add(geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scl = 1) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) {
      if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    }
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    g.morphAttributes = {};
    const sc = typeof scl === 'number' ? [scl, scl, scl] : scl;
    _m.compose(_p.set(...pos), _q.setFromEuler(_e.set(...rot)), _s.set(...sc));
    g.applyMatrix4(_m);
    if (!this.buckets.has(mat)) this.buckets.set(mat, []);
    this.buckets.get(mat).push(g);
    return this;
  }

  /** Mirror helper: adds part at +z and -z */
  addPair(geo, mat, pos, rot = [0, 0, 0], scl = 1) {
    this.add(geo, mat, pos, rot, scl);
    this.add(geo, mat, [pos[0], pos[1], -pos[2]], [-rot[0], -rot[1], rot[2]], scl);
    return this;
  }

  build(group = new THREE.Group(), castShadow = true) {
    for (const [mat, geos] of this.buckets) {
      const merged = mergeGeometries(geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = castShadow && !mat.transparent;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    this.buckets.clear();
    return group;
  }
}

// Smooth deterministic 3D value-ish noise (cheap, no tables)
function sculptNoise(x, y, z) {
  return (
    Math.sin(x * 1.7 + Math.sin(y * 1.3)) * 0.5 +
    Math.sin(y * 2.3 + Math.sin(z * 1.9)) * 0.3 +
    Math.sin(z * 2.9 + Math.sin(x * 2.1)) * 0.2
  );
}

/**
 * Displace vertices along normals for an organic "pressed by hand" surface.
 * Vertices sharing a position receive identical offsets so seams stay closed.
 */
export function sculpt(geo, amount = 0.6, freq = 0.12, seed = 0) {
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const d = sculptNoise(v.x * freq + seed, v.y * freq - seed, v.z * freq + seed * 0.5) * amount;
    pos.setXYZ(i, v.x + n.x * d, v.y + n.y * d, v.z + n.z * d);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Streamlined fuselage via lathe. profile = [[radius, t(0..1 tail->nose)], ...]
 */
export function fuselageGeo(length, profile, radial = 28, sx = 1, sz = 1) {
  const pts = profile.map(([r, t]) => new THREE.Vector2(Math.max(0.001, r), (t - 0.5) * length));
  const geo = new THREE.LatheGeometry(pts, radial);
  geo.rotateZ(-Math.PI / 2); // lathe Y axis -> +X
  geo.scale(1, sx, sz);
  return geo;
}

/** Rounded-rect shape helper */
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Thick bevelled clay wing. Chord along X, span along Z, thickness along Y.
 * taper < 1 narrows the tips.
 */
export function wingGeo(span, chord, thick, taper = 0.75, sweep = 0) {
  // Plan-form drawn in XY then rotated so Y -> Z (span)
  const s = new THREE.Shape();
  const hs = span / 2, hc = chord / 2, tc = hc * taper;
  const r = Math.min(tc, 6);
  s.moveTo(-hc, 0);
  s.lineTo(-tc - sweep, hs - r);
  s.quadraticCurveTo(-tc - sweep, hs, -tc - sweep + r, hs);
  s.lineTo(tc - sweep - r, hs);
  s.quadraticCurveTo(tc - sweep, hs, tc - sweep, hs - r);
  s.lineTo(hc, 0);
  s.lineTo(tc - sweep, -hs + r);
  s.quadraticCurveTo(tc - sweep, -hs, tc - sweep - r, -hs);
  s.lineTo(-tc - sweep + r, -hs);
  s.quadraticCurveTo(-tc - sweep, -hs, -tc - sweep, -hs + r);
  s.lineTo(-hc, 0);

  const bev = thick * 0.45;
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.1, thick - bev * 2),
    bevelEnabled: true,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 4,
    curveSegments: 10
  });
  geo.translate(0, 0, -(thick - bev * 2) / 2);
  geo.rotateX(Math.PI / 2); // shape Y -> -Z, extrude Z -> Y
  return geo;
}

/** Rounded slab (fins, panels) */
export function slabGeo(w, h, thick, radius = 3) {
  const bev = thick * 0.4;
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, radius), {
    depth: Math.max(0.1, thick - bev * 2),
    bevelEnabled: true,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 3,
    curveSegments: 8
  });
  geo.translate(0, 0, -(thick - bev * 2) / 2);
  return geo;
}

export function capsuleGeo(radius, length, axis = 'x') {
  const geo = new THREE.CapsuleGeometry(radius, length, 6, 16);
  if (axis === 'x') geo.rotateZ(Math.PI / 2);
  else if (axis === 'z') geo.rotateX(Math.PI / 2);
  return geo;
}

export function sphereGeo(r, sx = 1, sy = 1, sz = 1, seg = 24) {
  const g = new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75));
  g.scale(sx, sy, sz);
  return g;
}

/** Cylinder along X */
export function cylX(rTop, rBot, len, seg = 16) {
  const g = new THREE.CylinderGeometry(rTop, rBot, len, seg);
  g.rotateZ(-Math.PI / 2);
  return g;
}

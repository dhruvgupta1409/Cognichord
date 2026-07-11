export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, x))));
const clampW = (w: number): number => Math.max(-6, Math.min(6, w));

export interface MiniNet {
  nIn: number;
  nHid: number;
  nOut: number;
  seed: number;
  W1: number[][];
  W2: number[][];
  b1: number[];
  b2: number[];
  aIn: number[];
  aHid: number[];
  aOut: number[];
  use1: number[][];
  use2: number[][];
  epoch: number;
}

export function createNet(nIn: number, nHid: number, nOut: number, seed = 1337): MiniNet {
  const rng = mulberry32(seed);
  const s1 = 1 / Math.sqrt(nIn);
  const s2 = 1 / Math.sqrt(nHid);
  const rand = (s: number) => (rng() * 2 - 1) * s;

  const W1 = Array.from({ length: nIn }, () => Array.from({ length: nHid }, () => rand(s1)));
  const W2 = Array.from({ length: nHid }, () => Array.from({ length: nOut }, () => rand(s2)));
  return {
    nIn,
    nHid,
    nOut,
    seed,
    W1,
    W2,
    b1: new Array(nHid).fill(0),
    b2: new Array(nOut).fill(0),
    aIn: new Array(nIn).fill(0),
    aHid: new Array(nHid).fill(0),
    aOut: new Array(nOut).fill(0),
    use1: Array.from({ length: nIn }, () => new Array(nHid).fill(0)),
    use2: Array.from({ length: nHid }, () => new Array(nOut).fill(0)),
    epoch: 0,
  };
}

export function forward(net: MiniNet, input: number[]): number[] {
  const { nIn, nHid, nOut, W1, W2, b1, b2 } = net;
  for (let i = 0; i < nIn; i++) net.aIn[i] = input[i];

  for (let j = 0; j < nHid; j++) {
    let z = b1[j];
    for (let i = 0; i < nIn; i++) z += W1[i][j] * net.aIn[i];
    net.aHid[j] = sigmoid(z);
  }
  for (let k = 0; k < nOut; k++) {
    let z = b2[k];
    for (let j = 0; j < nHid; j++) z += W2[j][k] * net.aHid[j];
    net.aOut[k] = sigmoid(z);
  }
  return net.aOut;
}

export function loss(net: MiniNet, target: number[]): number {
  let s = 0;
  for (let k = 0; k < net.nOut; k++) {
    const d = target[k] - net.aOut[k];
    s += d * d;
  }
  return s / net.nOut;
}

export function match(net: MiniNet, target: number[]): number {
  let s = 0;
  for (let k = 0; k < net.nOut; k++) s += Math.abs(target[k] - net.aOut[k]);
  return Math.max(0, 1 - s / net.nOut);
}

export function trainStep(
  net: MiniNet,
  input: number[],
  target: number[],
  lr: number,
  decay: number,
): number {
  forward(net, input);
  const stepLoss = loss(net, target);
  const { nIn, nHid, nOut, W2 } = net;

  const dOut = new Array<number>(nOut);
  for (let k = 0; k < nOut; k++) {
    const a = net.aOut[k];
    dOut[k] = (target[k] - a) * a * (1 - a);
  }
  const dHid = new Array<number>(nHid);
  for (let j = 0; j < nHid; j++) {
    let back = 0;
    for (let k = 0; k < nOut; k++) back += W2[j][k] * dOut[k];
    const a = net.aHid[j];
    dHid[j] = back * a * (1 - a);
  }

  for (let j = 0; j < nHid; j++) {
    const pre = net.aHid[j];
    for (let k = 0; k < nOut; k++) {
      net.W2[j][k] = clampW(net.W2[j][k] + lr * pre * dOut[k] - decay * net.W2[j][k]);
      net.use2[j][k] += 0.04 * (pre * net.aOut[k] - net.use2[j][k]);
    }
  }
  for (let k = 0; k < nOut; k++) net.b2[k] += lr * dOut[k];

  for (let i = 0; i < nIn; i++) {
    const pre = net.aIn[i];
    for (let j = 0; j < nHid; j++) {
      net.W1[i][j] = clampW(net.W1[i][j] + lr * pre * dHid[j] - decay * net.W1[i][j]);
      net.use1[i][j] += 0.04 * (pre * net.aHid[j] - net.use1[i][j]);
    }
  }
  for (let j = 0; j < nHid; j++) net.b1[j] += lr * dHid[j];

  net.epoch++;
  return stepLoss;
}

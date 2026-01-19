import { NextResponse } from 'next/server';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { translateMonster } from '@/lib/monster-translator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FIVETOOLS_BASE = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/bestiary';

type FiveEToolsMonster = {
  name: string;
  type?: any;
  cr?: any;
  ac?: any;
  hp?: any;
};

function fixEncoding(value?: string): string {
  if (!value) return '';
  if (/[Ã�]/.test(value)) {
    try {
      const decoded = Buffer.from(value, 'latin1').toString('utf8');
      if (decoded) value = decoded;
    } catch (e) {
      /* ignore */
    }
  }
  return value;
}

const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function normalizeName(name?: string) {
  const fixed = fixEncoding(name);
  return stripDiacritics(fixed)
    .toLowerCase()
    .trim();
}

function toNumber(v: any): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'string' && v.includes('/')) {
    const [a, b] = v.split('/');
    const num = Number(a);
    const den = Number(b);
    if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) return num / den;
  }
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

async function fetchBestiary(): Promise<{ monsters: FiveEToolsMonster[]; errors: string[] }> {
  const errors: string[] = [];
  const indexUrl = `${FIVETOOLS_BASE}/index.json`;
  let files: string[] = [];
  try {
    const indexRes = await fetch(indexUrl);
    if (indexRes.ok) {
      const indexData = await indexRes.json();
      files = Object.values(indexData) as string[];
    } else {
      errors.push(`index ${indexRes.status}`);
    }
  } catch (e: any) {
    errors.push(`index fetch error: ${String(e)}`);
  }

  const results: FiveEToolsMonster[] = [];
  for (const file of files) {
    try {
      const res = await fetch(`${FIVETOOLS_BASE}/${file}`);
      if (!res.ok) {
        errors.push(`${file} ${res.status}`);
        continue;
      }
      const json = await res.json();
      if (json?.monster) results.push(...json.monster);
    } catch (e: any) {
      errors.push(`${file} error: ${String(e)}`);
    }
  }

  return { monsters: results, errors };
}

function extractCR(cr: any): number | undefined {
  if (cr === undefined || cr === null) return undefined;
  if (typeof cr === 'object' && cr.cr) return toNumber(cr.cr);
  return toNumber(cr);
}

function extractAC(ac: any): number | undefined {
  if (ac === undefined || ac === null) return undefined;
  if (Array.isArray(ac) && ac.length > 0) return toNumber(ac[0].ac ?? ac[0]);
  return toNumber(ac);
}

function extractHP(hp: any): number | undefined {
  if (hp === undefined || hp === null) return undefined;
  if (typeof hp === 'object' && hp.average !== undefined) return toNumber(hp.average);
  return toNumber(hp);
}

async function getStatus() {
  const monstersSnap = await getDocs(collection(db, 'monsters'));
  let missingCR = 0;
  let missingPT = 0;
  const missingPTSample: string[] = [];

  monstersSnap.forEach(d => {
    const data = d.data() as any;
    if (!toNumber(data.challenge ?? data.cr)) missingCR++;
    const translated = translateMonster({ name: data.originalName || data.name, type: data.type });
    const same = normalizeName(data.name) === normalizeName(translated.name || data.originalName || data.name);
    if (!same) {
      missingPT++;
      if (missingPTSample.length < 25) missingPTSample.push(data.name || data.originalName || '');
    }
  });

  return {
    monsters: monstersSnap.size,
    missingCR,
    missingPT,
    missingPTSample,
  };
}

export async function GET() {
  try {
    const status = await getStatus();
    return NextResponse.json({ status });
  } catch (error: any) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { monsters: bestiary, errors } = await fetchBestiary();
    const sourceMap = new Map<string, FiveEToolsMonster>();
    for (const m of bestiary) {
      if (!m?.name) continue;
      sourceMap.set(normalizeName(m.name), m);
    }

    const snap = await getDocs(collection(db, 'monsters'));
    let updated = 0;
    let skipped = 0;
    let batch = writeBatch(db);
    let ops = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data() as any;
      const keyOriginal = normalizeName(data.originalName || data.name);
      const keyName = normalizeName(data.name);
      const source = sourceMap.get(keyOriginal) || sourceMap.get(keyName);
      if (!source) {
        skipped++;
        continue;
      }

      const translated = translateMonster({ name: source.name, type: source.type?.type || source.type });
      const challenge = extractCR(source.cr);
      const ac = extractAC(source.ac);
      const hp = extractHP(source.hp);
      const type = translated.type || data.type;
      const namePT = translated.name || data.name;

      const needsName = normalizeName(data.name) !== normalizeName(namePT);
      const needsCR = !toNumber(data.challenge ?? data.cr) && challenge !== undefined;
      const needsAC = !toNumber(data.ac) && ac !== undefined;
      const needsHP = !toNumber(data.hp) && hp !== undefined;

      const shouldUpdate = needsName || needsCR || needsAC || needsHP;
      if (!shouldUpdate) {
        skipped++;
        continue;
      }

      const originalName = data.originalName || data.name || source.name;

      const payload = removeUndefined({
        name: namePT,
        nameLower: normalizeName(namePT),
        originalName: fixEncoding(originalName),
        originalNameLower: normalizeName(originalName),
        type,
        challenge,
        ac,
        hp,
        source: data.source || '5etools-sync',
        updatedAt: new Date().toISOString(),
        xp: data.xp,
      });

      batch.update(doc(db, 'monsters', docSnap.id), payload);
      ops++;
      updated++;

      if (ops >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }

    if (ops > 0) {
      await batch.commit();
    }

    const status = await getStatus();
    return NextResponse.json({ updated, skipped, status, fetchErrors: errors });
  } catch (error: any) {
    return NextResponse.json({ error: String(error), stack: error?.stack }, { status: 500 });
  }
}

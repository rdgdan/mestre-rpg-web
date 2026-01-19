import { NextResponse } from 'next/server';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { dndMonsters } from '@/lib/monsters-data';
import { translateMonster } from '@/lib/monster-translator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function normalizeName(name?: string) {
  return (name || '').toLowerCase().trim();
}

function toNumber(v: any): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'string' && v.includes('/')) {
    const [a, b] = v.split('/');
    const num = Number(a);
    const den = Number(b);
    if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
      return num / den;
    }
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

// Build lookup from curated PT names
const sourceMap = new Map<string, any>();
dndMonsters.forEach(m => {
  if (!m || !m.name) return;
  sourceMap.set(normalizeName(m.name), m);
});

async function getStatus() {
  const monstersSnap = await getDocs(collection(db, 'monsters'));

  let missingCR = 0;
  let missingPT = 0;

  monstersSnap.forEach(d => {
    const data = d.data() as any;
    if (!data.challenge && !data.cr) missingCR++;
    if (!data.originalName) return;
    const translated = translateMonster({ name: data.originalName, type: data.type });
    const same = normalizeName(data.name) === normalizeName(translated.name || data.originalName);
    if (!same) missingPT++;
  });

  return {
    monsters: monstersSnap.size,
    missingCR,
    missingPT,
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
    const monstersSnap = await getDocs(collection(db, 'monsters'));
    let updated = 0;
    let skipped = 0;

    let batch = writeBatch(db);
    let ops = 0;

    for (const docSnap of monstersSnap.docs) {
      const data = docSnap.data() as any;

      const findSource = (cand?: string) => {
        if (!cand) return undefined;
        const norm = normalizeName(cand);
        if (sourceMap.has(norm)) return sourceMap.get(norm);
        const translated = translateMonster({ name: cand });
        const normPT = normalizeName(translated.name || cand);
        return sourceMap.get(normPT);
      };

      const source = findSource(data.originalName) || findSource(data.name);

      if (!source) {
        skipped++;
        continue;
      }

      const translated = translateMonster({
        name: source.name,
        type: source.type,
      });

      const challenge = toNumber(source.challenge ?? source.cr ?? data.challenge ?? data.cr);
      const hp = source.hp ?? data.hp;
      const ac = source.ac ?? data.ac;
      const type = translated.type || data.type;
      const namePT = translated.name || data.name;

      const needsName = !data.name || normalizeName(data.name) === normalizeName(data.originalName || '') || normalizeName(data.name) !== normalizeName(namePT);
      const needsCR = !toNumber(data.challenge ?? data.cr) && challenge !== undefined;

      const shouldUpdate = needsName || needsCR;

      if (!shouldUpdate) {
        skipped++;
        continue;
      }

      const originalName = data.originalName || data.name || source.name;

      const payload = removeUndefined({
        name: namePT,
        nameLower: normalizeName(namePT),
        originalName,
        originalNameLower: normalizeName(originalName),
        type,
        ac: toNumber(ac),
        hp: toNumber(hp),
        challenge,
        source: data.source || 'system',
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
    return NextResponse.json({ updated, skipped, status });
  } catch (error: any) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

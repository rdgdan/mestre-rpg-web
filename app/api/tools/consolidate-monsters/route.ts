import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { MONSTER_NAMES, MONSTER_TYPES } from '@/lib/monster-translator';

function fixEncoding(value?: string): string {
  if (!value) return '';
  // Attempt to fix common mojibake (UTF-8 read as Latin1)
  if (/[Ã�]/.test(value)) {
    try {
      const decoded = Buffer.from(value, 'latin1').toString('utf8');
      if (decoded) value = decoded;
    } catch (e) {
      // ignore decoding failures and keep original
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

function translateName(name: string): string {
  const fixed = fixEncoding(name);
  return MONSTER_NAMES[fixed] || fixed;
}

function translateType(type?: string): string | undefined {
  if (!type) return undefined;
  // Map "Constructo" etc already in PT-BR will be preserved
  // If type comes in EN, translate to PT-BR
  return MONSTER_TYPES[type] || type;
}

function toTitleCase(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toNumber(v: any): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
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

function scoreMonster(data: any): number {
  let score = 0;
  if (toNumber(data.challenge ?? data.challengeRating ?? data.cr) !== undefined) score += 5;
  if (toNumber(data.hp ?? data.hitPoints) !== undefined) score += 2;
  if (toNumber(data.ac ?? data.armorClass) !== undefined) score += 1;
  if (toNumber(data.xp) !== undefined) score += 1;
  if (data.originalName) score += 1;
  // Penalize obviously garbled encodings
  if (typeof data.name === 'string' && /Ã|�/.test(data.name)) score -= 2;
  return score;
}

function mergeMonsters(base: any, candidate: any): any {
  const merged = { ...base };

  merged.originalName = merged.originalName || candidate.originalName || candidate.name || merged.name;
  merged.type = merged.type || translateType(candidate.type) || candidate.type;
  merged.ac = merged.ac ?? merged.armorClass ?? candidate.ac ?? candidate.armorClass;
  merged.hp = merged.hp ?? merged.hitPoints ?? candidate.hp ?? candidate.hitPoints;
  merged.challenge = merged.challenge ?? merged.challengeRating ?? merged.cr ?? candidate.challenge ?? candidate.challengeRating ?? candidate.cr;
  merged.xp = merged.xp ?? candidate.xp;
  merged.source = merged.source || candidate.source;

  return merged;
}

async function getStatus() {
  const monstersSnap = await getDocs(collection(db, 'monsters'));
  const monstrosSnap = await getDocs(collection(db, 'monstros'));
  // Detect duplicates by normalized name in "monsters"
  const counts = new Map<string, number>();
  monstersSnap.forEach(d => {
    const data = d.data() as any;
    const n = normalizeName(data.name);
    if (!n) return;
    counts.set(n, (counts.get(n) || 0) + 1);
  });

  const duplicateNames: string[] = [];
  let duplicateDocs = 0;
  counts.forEach((count, name) => {
    if (count > 1) {
      duplicateDocs += count - 1; // number of extra docs beyond the first
      if (duplicateNames.length < 25) {
        duplicateNames.push(name);
      }
    }
  });

  return {
    monsters: monstersSnap.size,
    monstros: monstrosSnap.size,
    duplicates: {
      count: duplicateDocs,
      sample: duplicateNames,
    },
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
    // Build normalized set from current 'monsters'
    const monstersSnap = await getDocs(collection(db, 'monsters'));
    const existing = new Set<string>();
    monstersSnap.forEach(d => {
      const data = d.data() as any;
      const n = normalizeName(data.name);
      if (n) existing.add(n);
    });

    const oldSnap = await getDocs(collection(db, 'monstros'));
    let moved = 0;
    let skipped = 0;
    let deduped = 0;

    // Use batched writes for both inserts and deletes
    let batchOps = 0;
    let batch = writeBatch(db);

    for (const oldDoc of oldSnap.docs) {
      const data = oldDoc.data() as any;
      const originalName = data.originalName || data.name || '';
      const normalized = normalizeName(data.name || originalName);
      if (!normalized) {
        // No name -> just delete the broken doc
        batch.delete(oldDoc.ref);
        batchOps++;
        continue;
      }

      if (existing.has(normalized)) {
        // Duplicate: keep the one in 'monsters', delete from 'monstros'
        skipped++;
        batch.delete(oldDoc.ref);
        batchOps++;
      } else {
        // Transform schema and insert into 'monsters'
        const namePT = translateName(toTitleCase(data.name || originalName));
        const typePT = translateType(data.type);
        const ac = toNumber(data.ac ?? data.armorClass);
        const hp = toNumber(data.hp ?? data.hitPoints);
        const challenge = toNumber(data.challenge ?? data.challengeRating);
        const xp = toNumber(data.xp);

        const newDoc = removeUndefined({
          name: namePT,
          nameLower: normalizeName(namePT),
          originalName: originalName,
          originalNameLower: normalizeName(originalName),
          type: typePT,
          ac,
          hp,
          challenge,
          xp,
          source: data.source || 'system',
          createdAt: new Date().toISOString(),
        }) as any;

        const targetRef = doc(collection(db, 'monsters'));
        batch.set(targetRef, newDoc);
        batch.delete(oldDoc.ref);
        batchOps += 2;

        existing.add(normalized);
        moved++;
      }

      // Commit batch periodically to avoid limits
      if (batchOps >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        batchOps = 0;
      }
    }

    if (batchOps > 0) {
      await batch.commit();
    }

    // Second pass: deduplicate inside 'monsters' by originalName/name
    const runDedupe = async (keySelector: (data: any) => string) => {
      const snap = await getDocs(collection(db, 'monsters'));
      const groups = new Map<string, { id: string; data: any }[]>();

      snap.forEach(docSnap => {
        const data = docSnap.data() as any;
        const key = keySelector(data);
        if (!key) return;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push({ id: docSnap.id, data });
      });

      let localBatch = writeBatch(db);
      let localOps = 0;

      for (const [, docs] of groups) {
        if (!docs || docs.length <= 1) continue;

        docs.sort((a, b) => scoreMonster(b.data) - scoreMonster(a.data));
        const keeper = docs[0];
        let merged = { ...keeper.data };

        for (let i = 1; i < docs.length; i++) {
          merged = mergeMonsters(merged, docs[i].data);
        }

        const original = merged.originalName || merged.name;
        const namePT = translateName(toTitleCase(fixEncoding(merged.name || original || '')));
        const typePT = translateType(merged.type);

        const finalDoc = removeUndefined({
          ...merged,
          name: namePT,
          nameLower: normalizeName(namePT),
          originalName: fixEncoding(original),
          originalNameLower: normalizeName(original),
          type: typePT,
          ac: toNumber(merged.ac ?? merged.armorClass),
          hp: toNumber(merged.hp ?? merged.hitPoints),
          challenge: toNumber(merged.challenge ?? merged.challengeRating ?? merged.cr),
          xp: toNumber(merged.xp),
          source: merged.source || 'system',
          updatedAt: new Date().toISOString(),
        }) as any;

        localBatch.update(doc(collection(db, 'monsters'), keeper.id), finalDoc);
        localOps++;

        for (let i = 1; i < docs.length; i++) {
          localBatch.delete(doc(collection(db, 'monsters'), docs[i].id));
          localOps++;
          deduped++;
        }

        if (localOps >= 450) {
          await localBatch.commit();
          localBatch = writeBatch(db);
          localOps = 0;
        }
      }

      if (localOps > 0) {
        await localBatch.commit();
      }
    };

    await runDedupe(data => normalizeName(data.originalName || data.name));
    await runDedupe(data => normalizeName(data.name));

    const status = await getStatus();
    return NextResponse.json({ moved, skipped, deduped, status });
  } catch (error: any) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

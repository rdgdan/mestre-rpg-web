import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { firestoreCache } from '@/lib/cache-service';

type ArmaduraItem = {
  id: string;
  itemType?: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  weight?: number | string;
  price?: number | string;
};

export default function ArmadurasPage() {
  const [armaduras, setArmaduras] = useState<ArmaduraItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchArmaduras() {
      setIsLoading(true);

      try {
        let data: ArmaduraItem[] = [];
        const cachedItens = firestoreCache.get('itens');

        if (cachedItens) {
          data = cachedItens as ArmaduraItem[];
        } else {
          const snapshot = await getDocs(collection(db, 'itens'));
          data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as ArmaduraItem) }));
          firestoreCache.set('itens', data);
        }

        const filtered = data.filter(item =>
          (item.itemType || '').toUpperCase() === 'ARMADURA' ||
          (item.itemType || '').toUpperCase() === 'ARMOR'
        );

        setArmaduras(filtered);
      } catch (error) {
        console.error("Erro ao carregar armaduras:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArmaduras();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-cinzel font-bold text-rpg-gold mb-8 flex items-center gap-2">
        🛡️ Armaduras
      </h1>
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rpg-gold"></div>
          <span className="ml-4 text-rpg-grey font-medieval">Consultando os arsenais...</span>
        </div>
      ) : armaduras.length === 0 ? (
        <div className="text-center text-rpg-grey py-20 font-medieval italic">Nenhuma armadura encontrada nos registros.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {armaduras.map(item => (
            <div key={item.id} className="bg-rpg-panel border border-rpg-gold/10 p-5 rounded-2xl hover:border-rpg-gold/40 transition-all group relative overflow-hidden shadow-lg hover:shadow-rpg-gold/5">
              <h3 className="text-xl font-bold font-cinzel text-rpg-gold mb-2">{item.name || item.title}</h3>
              <p className="text-sm text-rpg-parchment/70 font-medieval line-clamp-3 mb-4">{item.description || 'Sem descrição.'}</p>
              <div className="mt-auto pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider font-cinzel text-rpg-grey">
                <div className="flex items-center gap-1">🏷️ <span className="text-rpg-parchment/60">{item.category || 'Geral'}</span></div>
                <div className="flex items-center gap-1">⚖️ <span className="text-rpg-parchment/60">{item.weight ?? '-'} kg</span></div>
                <div className="flex items-center gap-1 text-rpg-gold">💰 <span className="text-rpg-gold/80">{item.price ?? '-'} po</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

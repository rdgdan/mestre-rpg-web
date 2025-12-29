
import { srdBook, Chapter } from '@/lib/srd-book-data';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface ChapterPageParams {
  params: {
    bookId: string;
    chapterId: string;
  };
}

// Esta função ajuda o Next.js a saber quais rotas gerar no momento da compilação
export async function generateStaticParams() {
  return srdBook.chapters.map(chapter => ({
    bookId: srdBook.id,
    chapterId: chapter.id,
  }));
}

const ChapterPage = ({ params }: ChapterPageParams) => {
  if (params.bookId !== srdBook.id) {
    notFound();
  }

  const chapter = srdBook.chapters.find(c => c.id === params.chapterId);

  if (!chapter) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-rpg-dark text-rpg-parchment bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <header className="bg-rpg-panel p-4 shadow-lg border-b-2 border-rpg-gold/30 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <Link href={`/books/${srdBook.id}`} className="text-rpg-gold hover:text-rpg-gold-light hover:underline font-medieval tracking-wider">← Voltar ao Índice</Link>
              <h1 className="text-3xl font-bold font-cinzel text-rpg-gold mt-1 text-shadow-md">{chapter.title}</h1>
            </div>
            <Link href="/" className="bg-rpg-gold hover:bg-rpg-gold/80 p-2 px-4 rounded font-bold font-cinzel text-rpg-dark transition-all transform hover:scale-105 shadow-md hover:shadow-glow-gold border border-rpg-gold/50">
              Home
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-8">
        <div
          className="bg-rpg-panel rounded-lg border-2 border-rpg-gold/10 shadow-2xl p-6 lg:p-8 prose prose-invert max-w-none prose-h2:text-rpg-gold prose-h2:font-cinzel prose-h3:text-rpg-parchment prose-h3:font-cinzel prose-strong:text-rpg-gold prose-a:text-rpg-gold hover:prose-a:text-rpg-gold-light prose-p:font-medieval prose-p:text-lg prose-p:leading-relaxed shadow-black/50"
          dangerouslySetInnerHTML={{ __html: chapter.content }}
        />
      </main>
    </div>
  );
};

export default ChapterPage;

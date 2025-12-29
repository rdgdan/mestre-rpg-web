
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
    <div className="min-h-screen bg-background-start text-text">
      <header className="bg-surface p-4 shadow-lg border-b-2 border-accent/20 sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <Link href={`/books/${srdBook.id}`} className="text-primary hover:underline font-serif">← Voltar ao Índice</Link>
              <h1 className="text-3xl font-bold font-serif text-accent mt-1">{chapter.title}</h1>
            </div>
            <Link href="/" className="bg-primary hover:bg-primary/80 p-2 px-4 rounded font-bold font-serif text-text transition-all transform hover:scale-105 shadow-md">
                Home
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-8">
        <div 
          className="bg-surface/80 rounded-lg border border-text/10 shadow-xl p-6 lg:p-8 prose prose-invert max-w-none prose-h2:text-accent prose-h3:text-accent/90 prose-strong:text-text prose-a:text-primary hover:prose-a:text-primary/80"
          dangerouslySetInnerHTML={{ __html: chapter.content }}
        />
      </main>
    </div>
  );
};

export default ChapterPage;

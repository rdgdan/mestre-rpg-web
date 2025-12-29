
import Link from 'next/link';
import { srdBook } from '@/lib/srd-book-data';
import { notFound } from 'next/navigation';

interface BookPageParams {
  params: {
    bookId: string;
  };
}

export async function generateStaticParams() {
  return [{ bookId: srdBook.id }];
}

const BookPage = ({ params }: BookPageParams) => {
  // Por enquanto, só temos um livro. No futuro, buscaríamos o livro pelo ID.
  if (params.bookId !== srdBook.id) {
    notFound();
  }

  const book = srdBook;

  return (

    <div className="min-h-screen bg-rpg-dark text-rpg-parchment bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <header className="bg-rpg-panel p-4 shadow-lg border-b-2 border-rpg-gold/30 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto">
          <Link href="/books" className="text-rpg-gold hover:text-rpg-gold-light hover:underline font-medieval tracking-wider">← Voltar para a Biblioteca</Link>
          <h1 className="text-4xl font-bold font-cinzel text-rpg-gold mt-2 text-shadow-md">{book.title}</h1>
          <p className="text-rpg-parchment/80 font-medieval mt-1">Selecione um capítulo para começar a ler.</p>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-8">
        <div className="bg-rpg-panel rounded-lg border-2 border-rpg-gold/10 shadow-2xl p-6 shadow-black/50">
          <h2 className="text-2xl font-cinzel mb-4 text-rpg-gold border-b border-rpg-gold/20 pb-2">Índice de Capítulos</h2>
          <ul className="space-y-3">
            {book.chapters.map((chapter) => (
              <li key={chapter.id}>
                <Link href={`/books/${book.id}/${chapter.id}`}>
                  <div className="block p-4 rounded-md bg-rpg-slate hover:bg-rpg-gold/20 border border-transparent hover:border-rpg-gold/50 transition-all font-medieval text-lg text-rpg-parchment hover:text-rpg-gold hover:translate-x-1 cursor-pointer">
                    {chapter.title}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default BookPage;




import Link from 'next/link';
import { srdBook } from '@/lib/srd-book-data';
import { notFound } from 'next/navigation';

interface BookPageParams {
  params: {
    bookId: string;
  };
}

const BookPage = ({ params }: BookPageParams) => {
  // Por enquanto, só temos um livro. No futuro, buscaríamos o livro pelo ID.
  if (params.bookId !== srdBook.id) {
    notFound();
  }

  const book = srdBook;

  return (
    <div className="min-h-screen bg-background-start text-text">
      <header className="bg-surface p-4 shadow-lg border-b-2 border-accent/20">
        <div className="container mx-auto">
          <Link href="/books" className="text-primary hover:underline font-serif">← Voltar para a Biblioteca</Link>
          <h1 className="text-4xl font-bold font-serif text-accent mt-2">{book.title}</h1>
          <p className="text-text/80 font-sans mt-1">Selecione um capítulo para começar a ler.</p>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-8">
        <div className="bg-surface/80 rounded-lg border border-text/10 shadow-xl p-6">
          <h2 className="text-2xl font-serif mb-4">Índice de Capítulos</h2>
          <ul className="space-y-3">
            {book.chapters.map((chapter) => (
              <li key={chapter.id}>
                <Link href={`/books/${book.id}/${chapter.id}`}>
                  <div className="block p-4 rounded-md bg-background-end hover:bg-primary/10 border border-transparent hover:border-primary/50 transition-all font-serif text-lg">
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



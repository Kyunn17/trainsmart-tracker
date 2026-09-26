import Link from 'next/link';
import 'dotenv/config'
interface Exercise {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  exercises: Exercise[]
}

// Ini async function karena dia nunggu (await) data dateng dari Laravel
export default async function Home() {
  
  // 1. Tembak API Laravel lu pake fetch bawaan JavaScript
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu-latihan`, {
    cache: 'no-store' // Biar datanya selalu fresh, gak nyimpen cache lama
  });
  
  const result = await res.json();
  
  // 2. Ambil array data aslinya dari dalam bungkus JSON Laravel
  const categories = result.data;

  return (
    <main className="p-8 bg-zinc-950 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4">TRAINSMART - HYPERTROPHY TRACKER</h1>
      
      {/* 3. Tampilkan datanya ke layar pake map() */}
      
      <div className="space-y-4">
        {categories.map((category: Category) => (
          <Link href={`/workout/${category.id}`} key={category.id}>
          <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <h2 className="text-xl font-semibold text-yellow-500">{category.name}</h2>
            
            {/* Lakukan mapping lagi buat nampilin daftar gerakan di dalem kategori ini */}
            <ul className="mt-2 list-disc list-inside text-zinc-300">
              {category.exercises.map((exercise: Exercise) => (
                <li key={exercise.id}>{exercise.name}</li>
              ))}
            </ul>
          </div>
          </Link>
      
        ))}
      </div>
      
    </main>
  );
}
import Link from "next/link";

interface Exercise {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  exercises: Exercise[]
}
export default async function WorkoutSession({ params }: { params: Promise<{ id: string }> }) {

  const {id} = await params;

   // 1. Tembak API Laravel lu pake fetch bawaan JavaScript
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu-latihan`, {
    cache: 'no-store' // Biar datanya selalu fresh, gak nyimpen cache lama
  });
  
  const result = await res.json();
  
  // 2. Ambil array data aslinya dari dalam bungkus JSON Laravel
  const categories = result.data;

  console.log(id)
  console.log(categories)

  const category = categories.find((c : Category) => c.id.toString() === id);

  if(!category){
  return (
    <div className="p-8 bg-zinc-950 text-white min-h-screen">
        <h1 className="text-2xl font-bold text-red-500">Kategori latihan tidak ditemukan!</h1>
        <Link href="/" className="text-blue-400 hover:underline mt-4 inline-block">&larr; Kembali ke Home</Link>
      </div>
    );}

    return (
    <div className="p-8 bg-zinc-950 text-white min-h-screen">
      {/* 3. Tampilkan nama kategori yang lagi dipilih */}
      <h1 className="text-3xl font-bold text-yellow-500 mb-2">
        {category.name} Workout
      </h1>
      <p className="text-zinc-400 mb-6">Pilih gerakan di bawah untuk mulai mencatat beban dan repetisi.</p>
      
      {/* 4. Tampilkan daftar latihan (exercises) khusus kategori ini */}
      <div className="space-y-4">
        {category.exercises.map((exercise: Exercise) => (
          <div key={exercise.id} className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center">
            <span className="font-semibold text-lg">{exercise.name}</span>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Catat Set
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/" className="text-blue-400 hover:underline">
          &larr; Kembali ke Home
        </Link>
      </div>
    </div>
  );
}
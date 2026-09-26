import Link from "next/link";
import WorkoutPlanner from "@/app/components/WorkoutPlanner"; // Import komponen baru lu

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
      <h1 className="text-3xl font-bold text-yellow-500 mb-2">
        {category.name} Workout
      </h1>
      <p className="text-zinc-400 mb-6">Pilih gerakan di bawah untuk mulai mencatat beban dan repetisi.</p>
      
      {/* PANGGIL KOMPONEN CLIENT DI SINI, OPER DATANYA! */}
      <WorkoutPlanner initialCategory={category} />

      <div className="mt-8">
        <Link href="/" className="text-blue-400 hover:underline">
          &larr; Kembali ke Home
        </Link>
      </div>
    </div>
  );
}
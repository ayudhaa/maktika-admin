import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Plus, Trash2, LayoutGrid, Package, Image as ImageIcon, Tag, FileText } from 'lucide-react';

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', desc: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        name: form.name,
        price: Number(form.price),
        desc: form.desc,
        imageUrl: form.imageUrl,
        createdAt: new Date()
      });
      setForm({ name: '', price: '', desc: '', imageUrl: '' });
      alert("Katalog Berhasil Ditambah!");
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Hapus menu ini dari katalog?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF2] text-stone-800 font-sans pb-20">
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-1.5 rounded-lg text-white">
              <Package size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">Admin MakTika</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 shadow-md shadow-stone-200/50 border border-stone-100 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Plus size={20} className="text-orange-500" />
                Tambah Katalog Baru
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-400 ml-1">NAMA PRODUK</label>
                  <div className="relative">
                    <input type="text" placeholder="Contoh: Peyek Rebon" required className="w-full p-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 ring-orange-200 transition" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-400 ml-1">HARGA (RP)</label>
                  <input type="number" placeholder="25000" required className="w-full p-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 ring-orange-200 transition" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-400 ml-1">DESKRIPSI</label>
                  <textarea placeholder="Renyah dan gurih..." className="w-full p-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 ring-orange-200 transition" rows="3" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-400 ml-1">URL GAMBAR</label>
                  <input type="text" placeholder="https://link-foto.com/gambar.jpg" required className="w-full p-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 ring-orange-200 transition" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} />
                </div>

                <button disabled={loading} className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all active:scale-[0.98] disabled:bg-stone-300 mt-2">
                  {loading ? "Memproses..." : "Simpan ke Katalog"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LayoutGrid size={20} className="text-orange-500" />
                Daftar Menu Saat Ini
              </h2>
              <span className="text-sm text-stone-400 font-medium">{products.length} Produk</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-4 hover:border-orange-200 transition-colors group">
                  <div className="relative">
                    <img src={p.imageUrl} alt={p.name} className="w-20 h-20 object-cover rounded-2xl bg-stone-100" />
                    <div className="absolute inset-0 bg-black/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-800 truncate">{p.name}</h3>
                    <p className="text-orange-600 font-bold text-sm">Rp {p.price?.toLocaleString('id-ID')}</p>
                    <p className="text-stone-400 text-xs truncate mt-0.5">{p.desc || 'Tidak ada deskripsi'}</p>
                  </div>

                  <button onClick={() => deleteProduct(p.id)} className="p-2.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl py-20 text-center">
                <div className="text-stone-300 flex justify-center mb-4 italic">
                  <Package size={48} />
                </div>
                <p className="text-stone-400 font-medium">Belum ada data katalog.</p>
                <p className="text-xs text-stone-300">Gunakan form di samping untuk menambah menu.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
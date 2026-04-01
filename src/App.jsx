import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, LayoutGrid, LogOut } from 'lucide-react';

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', desc: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    setProducts(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => { fetchProducts(); }, []);

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
      fetchProducts();
      alert("Katalog Berhasil Ditambah!");
    } catch (err) { alert("Gagal simpan: " + err.message); }
    setLoading(false);
  };

  const deleteProduct = async (id) => {
    if(window.confirm("Hapus produk ini?")) {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF2] p-4 md:p-8 font-sans text-stone-800">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-xl text-white"><LayoutGrid size={24}/></div>
            <h1 className="text-xl md:text-2xl font-bold text-stone-800">Admin MakTika</h1>
          </div>
          <button onClick={() => window.location.reload()} className="text-stone-400 hover:text-orange-500 transition"><LogOut size={20}/></button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FORM INPUT */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 sticky top-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Tambah Katalog</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Nama Snack" required className="w-full p-3 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 ring-orange-200" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <input type="number" placeholder="Harga (Contoh: 20000)" required className="w-full p-3 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 ring-orange-200" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                <textarea placeholder="Deskripsi Singkat" className="w-full p-3 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 ring-orange-200" rows="3" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
                <input type="text" placeholder="Link Gambar (URL)" required className="w-full p-3 bg-stone-50 border-none rounded-xl outline-none focus:ring-2 ring-orange-200" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} />
                <button disabled={loading} className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 transition disabled:bg-stone-300">
                  {loading ? "Menyimpan..." : "Simpan Katalog"}
                </button>
              </div>
            </form>
          </div>

          {/* DAFTAR PRODUK */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-4 group">
                  <img src={p.imageUrl} alt={p.name} className="w-20 h-20 object-cover rounded-2xl bg-stone-100" />
                  <div className="flex-1">
                    <h3 className="font-bold text-stone-800">{p.name}</h3>
                    <p className="text-orange-600 font-bold text-sm">Rp {p.price?.toLocaleString('id-ID')}</p>
                  </div>
                  <button onClick={() => deleteProduct(p.id)} className="p-2 text-stone-300 hover:text-red-500 transition"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
            {products.length === 0 && <div className="text-center py-20 text-stone-400 italic">Belum ada data katalog.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
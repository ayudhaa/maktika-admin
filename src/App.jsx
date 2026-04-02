import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, addDoc, deleteDoc, doc, query, orderBy, 
  onSnapshot, getDoc, setDoc, updateDoc 
} from 'firebase/firestore';
import { 
  Plus, Trash2, LayoutGrid, Package, LogOut, 
  Lock, Users, UserPlus, CheckCircle, XCircle 
} from 'lucide-react';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { Confirm } from 'notiflix/build/notiflix-confirm-aio';
import { Loading } from 'notiflix/build/notiflix-loading-aio';

Notify.init({
  width: '300px',
  position: 'right-top',
  borderRadius: '15px',
  fontFamily: 'Quicksand',
  success: { background: '#f97316' },
});

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('katalog');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', desc: '', imageUrl: '' });
  const [allUsers, setAllUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.email));
        if (userDoc.exists() && userDoc.data().status === 'active') {
          setUser(currentUser);
          Notify.success(`Selamat Datang, ${currentUser.email}`);
        } else {
          await signOut(auth);
          Notify.failure("Akun Anda Nonaktif!");
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const qProd = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const unsubProd = onSnapshot(qProd, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
      const unsubUser = onSnapshot(collection(db, "users"), (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
      return () => { unsubProd(); unsubUser(); };
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    Loading.circle();
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPass);
      Loading.remove();
    } catch (err) {
      Loading.remove();
      Notify.failure("Gagal Login: Email atau Password Salah");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    Loading.pulse('Menyimpan data...');
    try {
      await addDoc(collection(db, "products"), {
        ...form,
        price: Number(form.price),
        createdAt: new Date()
      });
      setForm({ name: '', price: '', desc: '', imageUrl: '' });
      Loading.remove();
      Notify.success("Katalog Berhasil Ditambahkan!");
    } catch (err) { 
      Loading.remove();
      Notify.failure("Gagal Simpan: " + err.message); 
    }
  };

  const deleteProduct = (id) => {
    Confirm.show(
      'Hapus Produk',
      'Apakah Anda yakin ingin menghapus menu ini dari katalog ?',
      'Ya, Hapus',
      'Batal',
      async () => {
        await deleteDoc(doc(db, "products", id));
        Notify.info("Produk telah dihapus");
      },
      () => {},
      {
        okButtonBackground: '#ef4444',
        titleColor: '#1e293b',
      }
    );
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "users", newUserEmail), {
        email: newUserEmail,
        status: 'active',
        role: 'staff'
      });
      Notify.success("Akses Berhasil Diberikan!");
      setNewUserEmail('');
    } catch (err) { Notify.failure("Error: " + err.message); }
  };

  const toggleUserStatus = async (email, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, "users", email), { status: newStatus });
    Notify.info(`User ${email} sekarang ${newStatus}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFBF2] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md border border-stone-100">
          <div className="text-center mb-8">
            <div className="bg-orange-500 w-16 h-16 rounded-3xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-orange-200">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-stone-800">Admin MakTika</h1>
            <p className="text-stone-400 text-sm mt-1">Gunakan akses admin untuk mengelola</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:ring-2 ring-orange-200" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:ring-2 ring-orange-200" value={loginPass} onChange={e => setLoginPass(e.target.value)} required />
            <button className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all active:scale-95">Masuk Sekarang</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF2] text-stone-800 font-sans pb-20">
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 p-1.5 rounded-lg text-white">
                <Package size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">Admin MakTika</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('katalog')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'katalog' ? 'bg-orange-50 text-orange-600' : 'text-stone-400'}`}>Katalog</button>
              <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'users' ? 'bg-orange-50 text-orange-600' : 'text-stone-400'}`}>Kelola User</button>
            </div>
          </div>
          <button onClick={() => {
            signOut(auth);
            Notify.info("Anda telah keluar");
          }} className="flex items-center gap-2 text-stone-400 hover:text-red-500 font-bold text-sm transition">
            <LogOut size={18} /> <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {activeTab === 'katalog' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl p-6 shadow-md border border-stone-100 lg:sticky lg:top-24">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Plus size={20} className="text-orange-500" /> Tambah Katalog Baru
                </h2>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <input type="text" placeholder="Nama Snack" required className="w-full p-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 ring-orange-200 transition" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  <input type="number" placeholder="Harga" required className="w-full p-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 ring-orange-200 transition" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                  <textarea placeholder="Deskripsi Singkat..." className="w-full p-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 ring-orange-200 transition" rows="3" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
                  <input type="text" placeholder="URL Link Gambar" required className="w-full p-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 ring-orange-200 transition" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} />
                  <button className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all">Simpan ke Katalog</button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <LayoutGrid size={20} className="text-orange-500" /> Daftar Menu
                </h2>
                <span className="text-sm text-stone-400 font-medium">{products.length} Produk</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-3xl border border-stone-100 flex items-center gap-4 hover:border-orange-200 transition-colors group">
                    <img src={p.imageUrl} className="w-20 h-20 object-cover rounded-2xl bg-stone-100" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-stone-800 truncate">{p.name}</h3>
                      <p className="text-orange-600 font-bold text-sm">Rp {p.price?.toLocaleString('id-ID')}</p>
                    </div>
                    <button onClick={() => deleteProduct(p.id)} className="p-2.5 text-stone-300 hover:text-red-500 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-[40px] p-8 shadow-md border border-stone-100 mb-8">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <UserPlus size={22} className="text-orange-500" /> Izinkan Akses User Baru
              </h2>
              <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row gap-3">
                <input type="email" placeholder="Email User" required className="flex-1 p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 ring-orange-200 transition" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                <button className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all">Izinkan</button>
              </form>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 px-2">
                <Users size={22} className="text-orange-500" /> Daftar Pengelola
              </h2>
              {allUsers.map(u => (
                <div key={u.id} className="bg-white p-5 rounded-3xl border border-stone-100 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-bold text-stone-800">{u.email}</p>
                    <p className={`text-[10px] font-black uppercase mt-1 tracking-widest ${u.status === 'active' ? 'text-green-500' : 'text-red-400'}`}>● {u.status}</p>
                  </div>
                  <button onClick={() => toggleUserStatus(u.email, u.status)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${u.status === 'active' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    {u.status === 'active' ? <><XCircle size={14}/> Nonaktifkan</> : <><CheckCircle size={14}/> Aktifkan</>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
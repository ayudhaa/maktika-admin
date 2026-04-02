import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
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
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'katalog');
  const [user, setUser] = useState(null);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', desc: '', imageUrl: '' });
  
  const [allUsers, setAllUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.email));
          if (userDoc.exists() && userDoc.data().status === 'active') {
            setUser(currentUser);
          } else {
            await signOut(auth);
            Notify.failure("Akses Ditolak: Akun Anda Nonaktif!");
          }
        } catch (err) {
          await signOut(auth);
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
    Loading.circle('Mengecek Kredensial...');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPass);
      Loading.remove();
      Notify.success("Selamat Datang di Dashboard MakTika!");
    } catch (err) {
      Loading.remove();
      Notify.failure("Login Gagal: Email atau Password salah.");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    Loading.pulse('Menyimpan menu...');
    try {
      await addDoc(collection(db, "products"), {
        ...form,
        price: Number(form.price),
        createdAt: new Date()
      });
      setForm({ name: '', price: '', desc: '', imageUrl: '' });
      Loading.remove();
      Notify.success("Menu berhasil masuk katalog!");
    } catch (err) { 
      Loading.remove();
      Notify.failure("Gagal simpan: " + err.message); 
    }
  };

  const deleteProduct = (id) => {
    Confirm.show(
      'Hapus Produk',
      'Data yang dihapus tidak bisa dikembalikan. Lanjutkan?',
      'Ya, Hapus',
      'Batal',
      async () => {
        await deleteDoc(doc(db, "products", id));
        Notify.info("Produk dihapus");
      },
      () => {},
      { okButtonBackground: '#ef4444' }
    );
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (newUserPass.length < 6) return Notify.warning("Password minimal 6 karakter!");

    Loading.standard('Mendaftarkan User...');
    try {
      await createUserWithEmailAndPassword(auth, newUserEmail, newUserPass);
      await setDoc(doc(db, "users", newUserEmail), {
        email: newUserEmail,
        status: 'active',
        role: 'staff',
        createdAt: new Date()
      });
      Loading.remove();
      Notify.success(`User ${newUserEmail} Berhasil Dibuat!`);
      setNewUserEmail('');
      setNewUserPass('');
    } catch (err) {
      Loading.remove();
      Notify.failure("Gagal: " + err.message);
    }
  };

  const toggleUserStatus = async (email, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, "users", email), { status: newStatus });
    Notify.info(`Status ${email} menjadi ${newStatus}`);
  };

  const deleteUser = (email) => {
    Confirm.show(
      'Hapus Pengelola',
      `Hapus akses untuk ${email}? Staf ini tidak akan bisa login lagi.`,
      'Ya, Hapus',
      'Batal',
      async () => {
        await deleteDoc(doc(db, "users", email));
        Notify.info("Akses user telah dihapus");
      },
      () => {},
      { okButtonBackground: '#ef4444' }
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFBF2] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 rounded-[45px] shadow-2xl w-full max-w-md border border-stone-100">
          <div className="text-center mb-10">
            <div className="bg-orange-500 w-20 h-20 rounded-[28px] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-orange-200">
              <Lock size={40} />
            </div>
            <h1 className="text-3xl font-black text-stone-800 tracking-tight">Admin MakTika</h1>
            <p className="text-stone-400 font-medium mt-2">Login untuk kelola katalog produk</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <input type="email" placeholder="Email" className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:ring-4 ring-orange-50 transition" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:ring-4 ring-orange-50 transition" value={loginPass} onChange={e => setLoginPass(e.target.value)} required />
            <button className="w-full bg-orange-500 text-white p-5 rounded-3xl font-black text-lg hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all active:scale-95">Masuk Sekarang</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF2] text-stone-800 font-sans pb-20">
      <nav className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-xl text-white shadow-lg shadow-orange-200">
                <Package size={24} />
              </div>
              <span className="font-black text-2xl tracking-tighter hidden sm:block italic">Admin MakTika</span>
            </div>
            <div className="flex bg-stone-100 p-1 rounded-2xl">
              <button onClick={() => setActiveTab('katalog')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'katalog' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>KATALOG</button>
              <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'users' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>PENGELOLA</button>
            </div>
          </div>
          <button onClick={() => { signOut(auth); Notify.info("Sesi berakhir"); }} className="flex items-center gap-2 text-stone-400 hover:text-red-500 font-bold transition">
            <LogOut size={20} /> <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10">
        {activeTab === 'katalog' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-stone-200/40 border border-stone-100 lg:sticky lg:top-28">
                <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                  <Plus size={24} className="text-orange-500" /> Tambah Menu
                </h2>
                <form onSubmit={handleAddProduct} className="space-y-5">
                  <input type="text" placeholder="Nama Snack" required className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-4 ring-orange-50 transition" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  <input type="number" placeholder="Harga (Rp)" required className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-4 ring-orange-50 transition" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                  <textarea placeholder="Deskripsi..." className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-4 ring-orange-50 transition" rows="3" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
                  <input type="text" placeholder="URL Gambar Produk" required className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-4 ring-orange-50 transition" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} />
                  <button className="w-full bg-stone-900 text-white p-5 rounded-3xl font-black hover:bg-black shadow-2xl transition-all active:scale-95">SIMPAN KATALOG</button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                  <LayoutGrid size={24} className="text-orange-500" /> Daftar Menu
                </h2>
                <span className="px-4 py-2 bg-white rounded-full text-xs font-black text-stone-400 border border-stone-100 shadow-sm">{products.length} ITEM</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {products.map(p => (
                  <div key={p.id} className="bg-white p-5 rounded-[32px] border border-stone-100 flex items-center gap-5 hover:border-orange-300 transition-all group shadow-sm hover:shadow-xl hover:shadow-orange-100/50">
                    <img src={p.imageUrl} className="w-24 h-24 object-cover rounded-[24px] bg-stone-50 group-hover:scale-105 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-stone-800 truncate text-lg">{p.name}</h3>
                      <p className="text-orange-600 font-black">Rp {p.price?.toLocaleString('id-ID')}</p>
                    </div>
                    <button onClick={() => deleteProduct(p.id)} className="p-3 text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-[45px] p-10 shadow-2xl shadow-stone-200/50 border border-stone-100 mb-12">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                <UserPlus size={28} className="text-orange-500" /> Registrasi Staf Baru
              </h2>
              <form onSubmit={handleRegisterUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="email" placeholder="Email Staf" required className="p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-4 ring-orange-50 transition" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                <input type="password" placeholder="Password Baru" required className="p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-4 ring-orange-50 transition" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} />
                <button className="md:col-span-2 bg-orange-500 text-white p-5 rounded-[24px] font-black hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all">BUAT AKUN & IZINKAN AKSES</button>
              </form>
            </div>

            <div className="space-y-5 px-4">
              <h2 className="text-2xl font-black flex items-center gap-3 mb-6">
                <Users size={28} className="text-orange-500" /> Tim Pengelola
              </h2>
              {allUsers.map(u => (
                <div key={u.id} className="bg-white p-6 rounded-[32px] border border-stone-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${u.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
                    <div>
                      <p className="font-black text-stone-800 text-lg leading-tight">{u.email}</p>
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${u.status === 'active' ? 'text-green-500' : 'text-red-400'}`}>{u.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleUserStatus(u.email, u.status)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all ${u.status === 'active' ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}>
                      {u.status === 'active' ? <><XCircle size={16}/> NONAKTIFKAN</> : <><CheckCircle size={16}/> AKTIFKAN</>}
                    </button>
                    <button onClick={() => deleteUser(u.email)} className="p-3 text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm">
                      <Trash2 size={20} />
                    </button>
                  </div>
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
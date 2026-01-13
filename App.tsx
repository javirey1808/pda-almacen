import React, { useState, useEffect } from 'react';
import { Layout, LayoutPanelLeft, User, Package, Settings, LogOut, Share2, X, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ViewType, Order, OrderStatus } from './types';
import AdminDashboard from './components/AdminDashboard';
import OperatorPicking from './components/OperatorPicking';

// --- IMPORTAMOS FIREBASE ---
import { db } from './firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('ADMIN');
  const [orders, setOrders] = useState<Order[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  // --- 1. CONEXIÓN EN TIEMPO REAL (Sustituye a LocalStorage) ---
  useEffect(() => {
    // Nos conectamos a la colección 'orders'
    const ordersCollection = collection(db, 'orders');

    // Esta función se ejecuta sola cada vez que hay cambios en la nube
    const unsubscribe = onSnapshot(ordersCollection, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id, // Usamos el ID de Firebase
      })) as Order[];
      
      setOrders(ordersData);
    });

    // Limpieza al cerrar
    return () => unsubscribe();
  }, []);

  // --- 2. GUARDAR NUEVO PEDIDO EN LA NUBE ---
  const handleAddOrder = async (newOrder: Order) => {
    // En lugar de setOrders, lo enviamos a Firebase
    // Nota: Firebase creará un ID único automáticamente, así que desestructuramos para no enviar un ID vacío si lo hubiera
    const { id, ...orderData } = newOrder; 
    await addDoc(collection(db, 'orders'), orderData);
  };

  // --- 3. ACTUALIZAR ESTADO EN LA NUBE ---
  const handleUpdateOrder = async (updatedOrder: Order) => {
    // Buscamos el documento específico por su ID y lo actualizamos
    const orderRef = doc(db, 'orders', updatedOrder.id);
    await updateDoc(orderRef, { ...updatedOrder });
  };

  const appUrl = window.location.href;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Package className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">SGA<span className="text-blue-600">Pro</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
            <button
              onClick={() => setView('ADMIN')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                view === 'ADMIN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ADMIN
            </button>
            <button
              onClick={() => setView('OPERATOR')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                view === 'OPERATOR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              OPERARIO
            </button>
          </div>

          <button 
            onClick={() => setShowShareModal(true)}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
            title="Compartir App"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {view === 'ADMIN' ? (
          <AdminDashboard orders={orders} onAddOrder={handleAddOrder} />
        ) : (
          <OperatorPicking 
            orders={orders.filter(o => o.status !== OrderStatus.COMPLETED)} 
            onUpdateOrder={handleUpdateOrder} 
          />
        )}
      </main>

      {/* Footer / Status bar */}
      <footer className="bg-white border-t border-slate-200 px-4 py-2 text-[10px] text-slate-400 flex justify-between uppercase tracking-widest">
        <span>Modo: {view}</span>
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Conectado a la Nube
        </span>
      </footer>

      {/* Global Share App Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/90 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in-95">
            <div className="flex justify-end -mt-4 -mr-4">
              <button onClick={() => setShowShareModal(false)} className="p-2 text-slate-300 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-blue-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="text-blue-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Abrir en PDA / Móvil</h2>
              <p className="text-slate-500 text-sm mt-2">Escanea este código para abrir la aplicación en otro dispositivo del almacén.</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 inline-block mb-6">
              <QRCodeSVG value={appUrl} size={200} />
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl text-left border border-blue-100 mb-6">
              <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Tip de almacén:</p>
              <p className="text-xs text-blue-800 leading-snug">Una vez abierta en el móvil, selecciona <b>"Añadir a pantalla de inicio"</b> en tu navegador para usarla como una App nativa.</p>
            </div>

            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
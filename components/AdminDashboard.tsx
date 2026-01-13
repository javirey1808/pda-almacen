
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Upload, Image as ImageIcon, ClipboardPaste, Hash, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Order, OrderStatus } from '../types';
import { extractPickingData } from '../services/geminiService';

interface AdminDashboardProps {
  orders: Order[];
  onAddOrder: (order: Order) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, onAddOrder }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [palletNumber, setPalletNumber] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sharingOrder, setSharingOrder] = useState<Order | null>(null);

  const processImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const item = e.clipboardData?.items[0];
      if (item?.type.includes('image')) {
        const file = item.getAsFile();
        if (file) processImage(file);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImage]);

  const processOrder = async () => {
    if (!orderNumber || !palletNumber || !previewUrl) return alert("Faltan datos");
    setIsUploading(true);
    try {
      const items = await extractPickingData(previewUrl);
      const newOrder: Order = {
        id: '', // Firebase lo generará
        orderNumber,
        palletNumber,
        status: OrderStatus.PENDING,
        createdAt: new Date().toISOString(),
        items: items.map((i: any, idx: number) => ({
          id: `i-${idx}-${Date.now()}`,
          line: i.line || (idx + 1).toString(),
          location: i.location || '?',
          article: i.article || '?',
          quantity: i.quantity || 1,
          unit: i.unit || 'UN',
          serials: [],
          scannedCount: 0
        }))
      };
      onAddOrder(newOrder);
      setOrderNumber(''); setPalletNumber(''); setPreviewUrl(null);
    } catch (e) { alert("Error AI"); } finally { setIsUploading(false); }
  };

  const getShareableData = (order: Order) => JSON.stringify({
    s: 'SGA',
    id: order.id, // ID de Firebase clave para el operario
    n: order.orderNumber,
    p: order.palletNumber
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Plus className="text-blue-600" /> Nuevo Pedido
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Nº Pedido" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none" />
              <input placeholder="Nº Palet" value={palletNumber} onChange={e => setPalletNumber(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none" />
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center relative hover:bg-slate-50 transition-all">
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <ImageIcon className="mx-auto text-slate-300 w-12 h-12 mb-2" />
              <p className="text-sm text-slate-500">{previewUrl ? "Imagen cargada ✓" : "Sube o Pega (Ctrl+V) la lista"}</p>
            </div>
            <button onClick={processOrder} disabled={isUploading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50">
              {isUploading ? "Analizando..." : "Procesar con Inteligencia Artificial"}
            </button>
          </div>
          <div className="hidden md:flex bg-slate-50 rounded-3xl border border-slate-100 items-center justify-center overflow-hidden">
            {previewUrl ? <img src={previewUrl} className="max-h-64 object-contain" /> : <p className="text-slate-300 text-sm">Previsualización</p>}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-full flex justify-between items-start mb-4">
               <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${order.status === OrderStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                 {order.status}
               </span>
               <Hash className="text-slate-200 w-5 h-5" />
            </div>
            <h3 className="font-black text-xl text-slate-800">PAL: {order.palletNumber}</h3>
            <p className="text-sm text-slate-400 mb-6 font-medium">Pedido {order.orderNumber}</p>
            <button onClick={() => setSharingOrder(order)} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
              <QrCode className="w-4 h-4" /> Enviar a PDA
            </button>
          </div>
        ))}
      </div>

      {sharingOrder && (
        <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Escanea en PDA</h2>
            <div className="bg-white p-4 border-[12px] border-slate-50 rounded-[2.5rem] inline-block mb-6 shadow-inner">
              <QRCodeSVG value={getShareableData(sharingOrder)} size={240} level="L" />
            </div>
            <button onClick={() => setSharingOrder(null)} className="w-full py-4 bg-slate-100 text-slate-800 rounded-2xl font-bold">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

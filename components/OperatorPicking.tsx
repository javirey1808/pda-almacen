
import React, { useState, useRef, useEffect } from 'react';
import { Scan, ChevronRight, MapPin, ArrowLeft, Send, Trash2, QrCode, X, Check, Loader2 } from 'lucide-react';
import jsQR from 'jsqr';
import { Order, PickingItem, OrderStatus } from '../types';

interface OperatorPickingProps {
  orders: Order[];
  onUpdateOrder: (order: Order) => void;
}

const OperatorPicking: React.FC<OperatorPickingProps> = ({ orders, onUpdateOrder }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItem, setSelectedItem] = useState<PickingItem | null>(null);
  const [serialInput, setSerialInput] = useState('');
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;
    let stream: MediaStream | null = null;

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

          if (code) {
            try {
              const data = JSON.parse(code.data);
              if (data.s === 'SGA') {
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                
                // Buscamos el pedido en la lista local sincronizada
                const foundOrder = orders.find(o => o.id === data.id);
                if (foundOrder) {
                  setSelectedOrder(foundOrder);
                  setIsScanningQR(false);
                } else {
                  alert("Pedido no encontrado en la nube. Espera a que el Admin termine de procesarlo.");
                  setIsScanningQR(false);
                }
                return;
              }
            } catch (e) {
              console.log("QR no reconocido");
            }
          }
        }
      }
      animationId = requestAnimationFrame(tick);
    };

    if (isScanningQR) {
      setCameraError(null);
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().catch(() => setCameraError("Error al iniciar video."));
          requestAnimationFrame(tick);
        }
      })
      .catch(() => setCameraError("Error de cámara. Asegúrate de usar HTTPS."));
    }

    return () => {
      cancelAnimationFrame(animationId);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [isScanningQR, orders]);

  // Actualizar el pedido seleccionado si cambia en Firebase mientras lo tenemos abierto
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  if (isScanningQR) return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col">
      <div className="p-6 flex justify-between items-center text-white relative z-10 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-lg font-black tracking-tight">Escaneando Tarea...</h2>
        <button onClick={() => setIsScanningQR(false)} className="bg-white/10 p-3 rounded-2xl"><X /></button>
      </div>
      <div className="flex-1 relative overflow-hidden bg-slate-900">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
            <X className="w-12 h-12 text-rose-500 mb-4" />
            <p className="font-bold mb-4">{cameraError}</p>
            <button onClick={() => setIsScanningQR(false)} className="px-6 py-3 bg-white text-black rounded-2xl font-black">Volver</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-72 h-72 border-2 border-white/30 rounded-[3rem] shadow-[0_0_0_1000px_rgba(0,0,0,0.7)] relative overflow-hidden scan-anim">
                  <div className="absolute inset-0 border-4 border-blue-500/50 rounded-[3rem]"></div>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (selectedItem && selectedOrder) return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 border-b border-slate-200 flex items-center gap-3">
        <button onClick={() => setSelectedItem(null)} className="p-2"><ArrowLeft /></button>
        <div className="flex-1">
          <h2 className="font-black text-slate-800 leading-tight truncate">{selectedItem.article}</h2>
          <div className="flex items-center gap-1 text-blue-600">
            <MapPin className="w-3 h-3" /><span className="text-[10px] font-bold uppercase">{selectedItem.location}</span>
          </div>
        </div>
        <div className="bg-slate-100 px-3 py-1 rounded-full font-black text-xs">{selectedItem.serials.length}/{selectedItem.quantity}</div>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        <div className="relative">
          <input 
            autoFocus 
            type="text" 
            value={serialInput} 
            onChange={e => setSerialInput(e.target.value)} 
            onKeyDown={e => {
              if (e.key === 'Enter' && serialInput.trim()) {
                const updatedItem = { ...selectedItem, serials: [...selectedItem.serials, serialInput.trim()], scannedCount: selectedItem.scannedCount + 1 };
                setSelectedItem(updatedItem);
                setSerialInput('');
                if (navigator.vibrate) navigator.vibrate(50);
              }
            }} 
            placeholder="Introduce Serie..." 
            className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 text-lg font-mono outline-none focus:border-blue-500 shadow-sm transition-all" 
          />
          <button onClick={() => { 
            if(serialInput.trim()){
              setSelectedItem({ ...selectedItem, serials: [...selectedItem.serials, serialInput.trim()], scannedCount: selectedItem.scannedCount+1 }); 
              setSerialInput(''); 
              if (navigator.vibrate) navigator.vibrate(50);
            } 
          }} className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-xl shadow-lg"><Send className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2 pb-20">
          {selectedItem.serials.map((s, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center animate-in slide-in-from-bottom-2">
              <span className="font-mono text-sm font-bold">{s}</span>
              <button onClick={() => { const ns = [...selectedItem.serials]; ns.splice(idx,1); setSelectedItem({...selectedItem, serials: ns, scannedCount: ns.length}); }} className="text-rose-500 p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 bg-white border-t border-slate-200">
        <button onClick={() => { 
          onUpdateOrder({...selectedOrder, items: selectedOrder.items.map(i => i.id === selectedItem.id ? selectedItem : i)}); 
          setSelectedItem(null); 
        }} className="w-full py-4 rounded-2xl font-black bg-slate-900 text-white shadow-xl active:scale-95 transition-all">CONFIRMAR LÍNEA</button>
      </div>
    </div>
  );

  if (selectedOrder) return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOrder(null)} className="p-2 -ml-2"><ArrowLeft /></button>
          <h2 className="font-black text-slate-800">PAL: {selectedOrder.palletNumber}</h2>
        </div>
        <button onClick={() => { 
          if(confirm("¿Has terminado el palet completo?")) {
            onUpdateOrder({...selectedOrder, status: OrderStatus.COMPLETED}); 
            setSelectedOrder(null); 
          }
        }} className="bg-emerald-600 text-white px-5 py-2 rounded-2xl text-xs font-black shadow-lg">FINALIZAR</button>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-auto">
        {selectedOrder.items.map(item => {
          const isDone = item.scannedCount >= item.quantity;
          return (
            <div key={item.id} onClick={() => setSelectedItem(item)} className={`bg-white rounded-3xl border-2 p-5 flex justify-between items-center transition-all ${isDone ? 'border-emerald-200 bg-emerald-50/50 opacity-60' : 'border-white shadow-sm'}`}>
              <div className="flex-1">
                <h4 className="font-black text-sm text-slate-800 truncate">{item.article}</h4>
                <div className="flex items-center gap-1 text-blue-600 font-bold text-[10px] mt-1 uppercase tracking-tighter"><MapPin className="w-3 h-3" /> {item.location}</div>
              </div>
              <div className="flex items-center gap-3 pl-4">
                <span className="font-black text-xl">{item.scannedCount}/{item.quantity}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}><Check className="w-4 h-4" /></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 mb-4 animate-bounce-slow">
          <Scan className="text-white w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">PDA Picking</h2>
        <p className="text-slate-400 font-medium">Escanea una tarea del Admin</p>
      </div>

      <button onClick={() => setIsScanningQR(true)} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 active:scale-95 transition-all">
        <QrCode className="w-6 h-6" /> ESCANEAR NUEVA TAREA
      </button>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Tareas en Curso ({orders.length})</h3>
        {orders.map(order => (
          <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex justify-between items-center group active:scale-[0.98] transition-all">
            <div>
              <h4 className="font-black text-2xl text-slate-800">PAL: {order.palletNumber}</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Pedido: {order.orderNumber}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-50 transition-colors"><ChevronRight className="text-slate-300 group-hover:text-blue-500" /></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperatorPicking;

import React, { useState, useRef, useEffect } from 'react';
import { X, User, CreditCard, Banknote, Smartphone, FileText, CheckCircle, FileSignature as Signature } from 'lucide-react';
import { Order } from '../lib/supabase';

interface DeliveryReceptionModalProps {
  order: Order;
  driverId: string;
  onClose: () => void;
  onComplete: (receptionData: {
    receiverName: string;
    signature: string;
    amountReceived: number;
    paymentMethod: 'cash' | 'card' | 'transfer';
    changeGiven: number;
    notes?: string;
  }) => void;
}

function DeliveryReceptionModal({ order, driverId, onClose, onComplete }: DeliveryReceptionModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [receptionData, setReceptionData] = useState({
    receiverName: '',
    amountReceived: order.total,
    paymentMethod: 'cash' as 'cash' | 'card' | 'transfer',
    changeGiven: 0,
    notes: ''
  });
  const [signatureData, setSignatureData] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Set drawing style
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const handleInputChange = (field: string, value: string | number) => {
    setReceptionData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-calculate change for cash payments
    if (field === 'amountReceived' && receptionData.paymentMethod === 'cash') {
      const change = Math.max(0, Number(value) - order.total);
      setReceptionData(prev => ({ ...prev, changeGiven: change }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!receptionData.receiverName.trim()) {
      newErrors.receiverName = 'Le nom du réceptionnaire est requis';
    }

    if (!signatureData) {
      newErrors.signature = 'La signature est requise';
    }

    if (receptionData.amountReceived < order.total) {
      newErrors.amountReceived = 'Le montant reçu ne peut pas être inférieur au total';
    }

    if (receptionData.paymentMethod === 'cash' && receptionData.amountReceived < order.total) {
      newErrors.amountReceived = 'Montant insuffisant pour un paiement en espèces';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onComplete({
      receiverName: receptionData.receiverName.trim(),
      signature: signatureData,
      amountReceived: receptionData.amountReceived,
      paymentMethod: receptionData.paymentMethod,
      changeGiven: receptionData.changeGiven,
      notes: receptionData.notes.trim() || undefined
    });
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-5 w-5" />;
      case 'card': return <CreditCard className="h-5 w-5" />;
      case 'transfer': return <Smartphone className="h-5 w-5" />;
      default: return <Banknote className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Réception de Livraison</h2>
              <p className="text-green-100">Commande {order.order_number}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Résumé de la commande</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Client:</strong> {order.customer?.name}</p>
                <p><strong>Téléphone:</strong> {order.customer?.phone}</p>
              </div>
              <div>
                <p><strong>Total à encaisser:</strong> <span className="font-bold text-green-600">{order.total} MAD</span></p>
                <p><strong>Adresse:</strong> {order.delivery_address}</p>
              </div>
            </div>
          </div>

          {/* Receiver Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Informations du Réceptionnaire
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom et Prénom du réceptionnaire *
              </label>
              <input
                type="text"
                value={receptionData.receiverName}
                onChange={(e) => handleInputChange('receiverName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.receiverName ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Nom et prénom de la personne qui réceptionne"
              />
              {errors.receiverName && (
                <p className="text-red-600 text-sm mt-1">{errors.receiverName}</p>
              )}
            </div>
          </div>

          {/* Signature Pad */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Signature className="h-5 w-5 mr-2 text-purple-600" />
              Signature du Réceptionnaire
            </h3>
            
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                className={`w-full border rounded-lg cursor-crosshair touch-none ${
                  errors.signature ? 'border-red-300' : 'border-slate-300'
                }`}
                style={{ height: '200px' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-slate-600">Signez avec votre doigt ou votre souris</p>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Effacer
                </button>
              </div>
              {errors.signature && (
                <p className="text-red-600 text-sm mt-1">{errors.signature}</p>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-green-600" />
              Informations de Paiement
            </h3>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Moyen de paiement *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'cash', label: 'Espèces', icon: Banknote },
                  { value: 'card', label: 'Carte', icon: CreditCard },
                  { value: 'transfer', label: 'Virement', icon: Smartphone }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      handleInputChange('paymentMethod', value);
                      if (value !== 'cash') {
                        setReceptionData(prev => ({ ...prev, changeGiven: 0 }));
                      }
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 ${
                      receptionData.paymentMethod === value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-300 hover:border-green-300 text-slate-600'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Received */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Montant reçu (MAD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={order.total}
                  value={receptionData.amountReceived}
                  onChange={(e) => handleInputChange('amountReceived', Number(e.target.value))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.amountReceived ? 'border-red-300' : 'border-slate-300'
                  }`}
                />
                {errors.amountReceived && (
                  <p className="text-red-600 text-sm mt-1">{errors.amountReceived}</p>
                )}
              </div>

              {/* Change Given (only for cash) */}
              {receptionData.paymentMethod === 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monnaie rendue (MAD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={receptionData.changeGiven}
                    onChange={(e) => handleInputChange('changeGiven', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    readOnly
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Calculé automatiquement: {receptionData.amountReceived} - {order.total} = {receptionData.changeGiven}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes de réception (optionnel)
              </label>
              <textarea
                value={receptionData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                placeholder="Remarques particulières, état des produits, etc."
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Récapitulatif de la réception
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Réceptionnaire:</strong> {receptionData.receiverName || 'Non renseigné'}</p>
                <p><strong>Signature:</strong> {signatureData ? '✅ Signée' : '❌ Manquante'}</p>
              </div>
              <div>
                <p><strong>Montant:</strong> {receptionData.amountReceived} MAD</p>
                <p><strong>Paiement:</strong> {getPaymentIcon(receptionData.paymentMethod)} {getPaymentLabel(receptionData.paymentMethod)}</p>
                {receptionData.paymentMethod === 'cash' && receptionData.changeGiven > 0 && (
                  <p><strong>Monnaie:</strong> {receptionData.changeGiven} MAD</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!receptionData.receiverName.trim() || !signatureData}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                receptionData.receiverName.trim() && signatureData
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>Valider la Livraison</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPaymentLabel(method: string): string {
  switch (method) {
    case 'cash': return 'Espèces';
    case 'card': return 'Carte bancaire';
    case 'transfer': return 'Virement';
    default: return method;
  }
}

function getPaymentIcon(method: string) {
  switch (method) {
    case 'cash': return '💵';
    case 'card': return '💳';
    case 'transfer': return '📱';
    default: return '💵';
  }
}

export default DeliveryReceptionModal;
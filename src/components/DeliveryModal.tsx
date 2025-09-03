import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Check, AlertTriangle, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess: () => void;
  mode: 'deliver' | 'cancel';
}

export default function DeliveryModal({ isOpen, onClose, order, onSuccess, mode }: DeliveryModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverFirstName, setReceiverFirstName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [amountReceived, setAmountReceived] = useState(order?.total_amount || 0);
  const [changeAmount, setChangeAmount] = useState(0);
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);
  const [deliveryPhotoUrl, setDeliveryPhotoUrl] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPhoto, setCancelPhoto] = useState<File | null>(null);
  const [cancelPhotoUrl, setCancelPhotoUrl] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (paymentMethod === 'cash' && amountReceived > 0) {
      setChangeAmount(Math.max(0, amountReceived - (order?.total_amount || 0)));
    } else {
      setChangeAmount(0);
    }
  }, [amountReceived, paymentMethod, order?.total_amount]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL();
    setSignature(dataURL);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'delivery' | 'cancel') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'delivery') {
      setDeliveryPhoto(file);
      setDeliveryPhotoUrl(URL.createObjectURL(file));
    } else {
      setCancelPhoto(file);
      setCancelPhotoUrl(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('delivery-photos')
      .upload(path, file);
    
    if (error) throw error;
    return data.path;
  };

  const sendDeliveryEmail = async (deliveryData: any) => {
    // Appel à l'edge function pour envoyer l'email
    const { error } = await supabase.functions.invoke('send-delivery-email', {
      body: {
        type: 'delivery',
        order: order,
        delivery: deliveryData,
        customerEmail: order.customer_email
      }
    });
    
    if (error) console.error('Erreur envoi email:', error);
  };

  const sendCancelEmail = async (cancelData: any) => {
    // Appel à l'edge function pour envoyer l'email
    const { error } = await supabase.functions.invoke('send-cancel-email', {
      body: {
        type: 'cancel',
        order: order,
        cancel: cancelData,
        customerEmail: order.customer_email,
        adminEmail: 'admin@theiceguys.com'
      }
    });
    
    if (error) console.error('Erreur envoi email:', error);
  };

  const handleDelivery = async () => {
    if (!signature || !receiverName || !receiverFirstName || !deliveryPhoto) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Upload de la photo
      const photoPath = await uploadPhoto(
        deliveryPhoto, 
        `deliveries/${order.id}_${Date.now()}.jpg`
      );

      // Calcul du total avec TVA si nécessaire
      const totalWithTax = needsInvoice 
        ? order.total_amount * 1.20 
        : order.total_amount;

      // Enregistrement de la réception
      const { error: receptionError } = await supabase
        .from('delivery_receptions')
        .insert({
          order_id: order.id,
          driver_id: order.driver_id,
          receiver_name: receiverName,
          receiver_first_name: receiverFirstName,
          signature: signature,
          payment_method: paymentMethod,
          amount_received: amountReceived,
          change_amount: changeAmount,
          needs_invoice: needsInvoice,
          delivery_photo_url: photoPath,
          total_with_tax: totalWithTax
        });

      if (receptionError) throw receptionError;

      // Mise à jour du statut de la commande
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          has_reception: true,
          delivered_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Envoi de l'email de confirmation
      await sendDeliveryEmail({
        receiver_name: receiverName,
        receiver_first_name: receiverFirstName,
        payment_method: paymentMethod,
        amount_received: amountReceived,
        change_amount: changeAmount,
        needs_invoice: needsInvoice,
        total_with_tax: totalWithTax
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la livraison:', error);
      alert('Erreur lors de la validation de la livraison');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason || !cancelPhoto) {
      alert('Veuillez remplir la raison et ajouter une photo');
      return;
    }

    setLoading(true);
    try {
      // Upload de la photo
      const photoPath = await uploadPhoto(
        cancelPhoto, 
        `cancellations/${order.id}_${Date.now()}.jpg`
      );

      // Mise à jour du statut de la commande
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancel_reason: cancelReason,
          cancel_photo_url: photoPath,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Envoi des emails de notification
      await sendCancelEmail({
        reason: cancelReason,
        photo_url: photoPath
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      alert('Erreur lors de l\'annulation de la commande');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'deliver' ? '📦 Finaliser la Livraison' : '❌ Annuler la Commande'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {mode === 'deliver' ? (
            <>
              {/* Étape 1: Informations du réceptionnaire */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">👤 Informations du Réceptionnaire</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nom du réceptionnaire"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={receiverFirstName}
                        onChange={(e) => setReceiverFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Prénom du réceptionnaire"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!receiverName || !receiverFirstName}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {/* Étape 2: Paiement */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">💳 Informations de Paiement</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moyen de paiement
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Espèces</option>
                      <option value="card">Carte bancaire</option>
                      <option value="transfer">Virement</option>
                    </select>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600 mb-2">
                      Montant de la commande: <span className="font-semibold">{order.total_amount}€</span>
                    </p>
                    
                    {paymentMethod === 'cash' && (
                      <>
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Montant reçu (€)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        {changeAmount > 0 && (
                          <p className="text-sm text-orange-600">
                            Monnaie à rendre: <span className="font-semibold">{changeAmount.toFixed(2)}€</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="needsInvoice"
                      checked={needsInvoice}
                      onChange={(e) => setNeedsInvoice(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="needsInvoice" className="text-sm text-gray-700">
                      Le client souhaite une facture avec TVA (20%)
                    </label>
                  </div>

                  {needsInvoice && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-800">
                        Total avec TVA: <span className="font-semibold">{(order.total_amount * 1.20).toFixed(2)}€</span>
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {/* Étape 3: Signature */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">✍️ Signature du Client</h3>
                  
                  <div className="border-2 border-gray-300 rounded-md p-4">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={200}
                      className="border border-gray-200 w-full cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div className="flex justify-between mt-2">
                      <button
                        onClick={clearSignature}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Effacer
                      </button>
                      <button
                        onClick={saveSignature}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      disabled={!signature}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {/* Étape 4: Photo de livraison */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">📸 Photo de la Livraison</h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    {deliveryPhotoUrl ? (
                      <div>
                        <img src={deliveryPhotoUrl} alt="Photo de livraison" className="max-w-full h-48 object-cover mx-auto rounded-md mb-4" />
                        <button
                          onClick={() => {
                            setDeliveryPhoto(null);
                            setDeliveryPhotoUrl('');
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Supprimer la photo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Prenez une photo de la livraison</p>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoUpload(e, 'delivery')}
                          className="hidden"
                          id="delivery-photo"
                        />
                        <label
                          htmlFor="delivery-photo"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer inline-flex items-center"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Prendre une photo
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={handleDelivery}
                      disabled={!deliveryPhoto || loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Validation...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Valider la Livraison
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Mode Annulation */
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800 font-medium">Annulation de la commande #{order.id}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de l'annulation *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Expliquez en détail la raison de l'annulation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo justificative *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  {cancelPhotoUrl ? (
                    <div>
                      <img src={cancelPhotoUrl} alt="Photo d'annulation" className="max-w-full h-48 object-cover mx-auto rounded-md mb-4" />
                      <button
                        onClick={() => {
                          setCancelPhoto(null);
                          setCancelPhotoUrl('');
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Supprimer la photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Photo obligatoire pour justifier l'annulation</p>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'cancel')}
                        className="hidden"
                        id="cancel-photo"
                      />
                      <label
                        htmlFor="cancel-photo"
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer inline-flex items-center"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Prendre une photo
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason || !cancelPhoto || loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Annulation...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Confirmer l'Annulation
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
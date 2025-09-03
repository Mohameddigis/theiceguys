import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Check, AlertCircle, FileSignature as Signature } from 'lucide-react';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onConfirm: (data: any) => void;
  type: 'deliver' | 'cancel';
}

export default function DeliveryModal({ isOpen, onClose, order, onConfirm, type }: DeliveryModalProps) {
  const [step, setStep] = useState(1);
  const [receiverName, setReceiverName] = useState('');
  const [receiverFirstName, setReceiverFirstName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [signature, setSignature] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalAmount = order?.total || 0;
  const amountWithTax = needsInvoice ? totalAmount * 1.2 : totalAmount;
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, parseFloat(amountReceived || '0') - amountWithTax) : 0;

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setReceiverName('');
    setReceiverFirstName('');
    setPaymentMethod('cash');
    setAmountReceived('');
    setNeedsInvoice(false);
    setSignature('');
    setPhoto(null);
    setPhotoPreview('');
    setCancelReason('');
    clearCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignature('');
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        setSignature(canvas.toDataURL());
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (type === 'deliver') {
      // Valider les données de livraison
      if (!receiverName.trim() || !receiverFirstName.trim() || !signature || !photo) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }
      
      const deliveryData = {
        receiverName,
        receiverFirstName,
        paymentMethod,
        amountReceived: parseFloat(amountReceived),
        changeAmount,
        needsInvoice,
        taxAmount: needsInvoice ? totalAmount * 0.2 : 0,
        totalWithTax: amountWithTax,
        signature,
        photo,
        orderId: order.id
      };
      onConfirm(deliveryData);
    } else {
      // Valider les données d'annulation
      if (!cancelReason.trim() || cancelReason.length < 10 || !photo) {
        alert('Veuillez remplir la raison (min 10 caractères) et ajouter une photo');
        return;
      }
      
      const cancelData = {
        reason: cancelReason,
        photo,
        orderId: order.id
      };
      onConfirm(cancelData);
    }
  };

  const canProceedToNextStep = () => {
    switch (step) {
      case 1:
        return receiverName.trim() && receiverFirstName.trim();
      case 2:
        if (paymentMethod === 'cash') {
          return parseFloat(amountReceived || '0') >= amountWithTax;
        }
        return true;
      case 3:
        return signature.length > 0;
      case 4:
        return photo !== null;
      default:
        return false;
    }
  };

  const canSubmitCancellation = () => {
    return cancelReason.trim().length > 10 && photo !== null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {type === 'deliver' ? '📦 Confirmer la Livraison' : '❌ Annuler la Commande'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {type === 'deliver' ? (
            <>
              {/* Progress Steps */}
              <div className="flex justify-between mb-6">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNum}
                  </div>
                ))}
              </div>

              {/* Step 1: Receiver Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    👤 Informations du Réceptionnaire
                  </h3>
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
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    💳 Informations de Paiement
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moyen de paiement
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">💵 Espèces</option>
                      <option value="card">💳 Carte bancaire</option>
                      <option value="transfer">🏦 Virement</option>
                    </select>
                  </div>

                  {paymentMethod === 'cash' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Montant reçu (DH) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="needsInvoice"
                      checked={needsInvoice}
                      onChange={(e) => setNeedsInvoice(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="needsInvoice" className="text-sm text-gray-700">
                      Client souhaite une facture (TVA 20%)
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sous-total:</span>
                      <span>{totalAmount.toFixed(2)} DH</span>
                    </div>
                    {needsInvoice && (
                      <div className="flex justify-between text-sm">
                        <span>TVA (20%):</span>
                        <span>{(totalAmount * 0.2).toFixed(2)} DH</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total à payer:</span>
                      <span>{amountWithTax.toFixed(2)} DH</span>
                    </div>
                    {paymentMethod === 'cash' && changeAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Monnaie à rendre:</span>
                        <span>{changeAmount.toFixed(2)} DH</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Signature */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ✍️ Signature du Client
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={150}
                      className="w-full border border-gray-200 rounded cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div className="flex justify-between mt-2">
                      <p className="text-sm text-gray-600">
                        Demandez au client de signer ci-dessus
                      </p>
                      <button
                        onClick={clearCanvas}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Effacer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Photo */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📸 Photo de la Livraison
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {photoPreview ? (
                      <div className="space-y-4">
                        <img
                          src={photoPreview}
                          alt="Photo de livraison"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => {
                            setPhoto(null);
                            setPhotoPreview('');
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Changer la photo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="text-gray-600">Prenez une photo de la livraison</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Choisir une photo</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Cancellation Form */
            <div className="space-y-4">
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
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 10 caractères ({cancelReason.length}/10)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo justificative *
                </label>
                <div className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center">
                  {photoPreview ? (
                    <div className="space-y-4">
                      <img
                        src={photoPreview}
                        alt="Photo justificative"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview('');
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Changer la photo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                      <p className="text-gray-600">Photo obligatoire pour justifier l'annulation</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 mx-auto"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Prendre une photo</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>

            <div className="flex space-x-3">
              {type === 'deliver' && step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Précédent
                </button>
              )}

              {type === 'deliver' ? (
                step < 4 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceedToNextStep()}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                      canProceedToNextStep()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Suivant</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!canProceedToNextStep()}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                      canProceedToNextStep()
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmer Livraison</span>
                  </button>
                )
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmitCancellation()}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                    canSubmitCancellation()
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Confirmer Annulation</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
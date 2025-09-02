import React, { useState } from 'react';
import { ArrowLeft, Users, Package, Truck, Clock, MapPin, User, Phone, Mail, MessageCircle, Rocket, Check, Navigation } from 'lucide-react';
import { orderService } from '../lib/supabase';

interface ProfessionalOrderPageProps {
  onBack: () => void;
}

interface IceType {
  id: string;
  name: string;
  description: string;
  price5kg: number;
  price10kg: number;
  price20kg: number;
  image: string;
}

interface OrderItem {
  iceType: IceType;
  quantities: {
    '5kg': number;
    '10kg': number;
    '20kg': number;
  };
}

function ProfessionalOrderPage({ onBack }: ProfessionalOrderPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [isExpressDelivery, setIsExpressDelivery] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    date: '',
    time: '',
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  // Scroll to top when step changes
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    setTimeout(scrollToTop, 100);
  };

  const iceTypes: IceType[] = [
    {
      id: 'nuggets',
      name: "Nugget's",
      description: 'Glaçons en forme de pépites, parfaits pour vos cocktails et boissons',
      price5kg: 30,
      price10kg: 60,
      price20kg: 100,
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/nugget-verre.png'
    },
    {
      id: 'gourmet',
      name: 'Gourmet',
      description: 'Glaçons de forme cylindrique, idéaux pour vos événements spéciaux',
      price5kg: 35,
      price10kg: 70,
      price20kg: 120,
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/gourmet-verre.png'
    },
    {
      id: 'cubique',
      name: 'Glace Paillette',
      description: 'Glace en paillettes, idéale pour la présentation et le refroidissement rapide',
      price5kg: 25,
      price10kg: 50,
      price20kg: 85,
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/glace-en-paillettes-110145.jpg'
    }
  ];

  // Check if express delivery is available (8h-23h)
  const isExpressAvailable = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 8 && hour < 23;
  };

  const handleIceTypeToggle = (iceType: IceType) => {
    const existingIndex = selectedItems.findIndex(item => item.iceType.id === iceType.id);
    
    if (existingIndex >= 0) {
      setSelectedItems(selectedItems.filter((_, index) => index !== existingIndex));
    } else {
      setSelectedItems([...selectedItems, {
        iceType,
        quantities: { '5kg': 0, '10kg': 0, '20kg': 0 }
      }]);
    }
  };

  const handleQuantityChange = (iceTypeId: string, size: '5kg' | '10kg' | '20kg', quantity: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.iceType.id === iceTypeId 
        ? { ...item, quantities: { ...item.quantities, [size]: Math.max(0, quantity) } }
        : item
    ));
  };

  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((total, item) => {
      const { quantities, iceType } = item;
      return total + 
        (quantities['5kg'] * iceType.price5kg) +
        (quantities['10kg'] * iceType.price10kg) +
        (quantities['20kg'] * iceType.price20kg);
    }, 0);
    
    const expressDeliveryFee = isExpressDelivery ? 100 : 0;
    return itemsTotal + expressDeliveryFee;
  };

  const getTotalQuantity = () => {
    return selectedItems.reduce((total, item) => {
      return total + item.quantities['5kg'] + item.quantities['10kg'] + item.quantities['20kg'];
    }, 0);
  };

  const canProceedToStep2 = () => {
    return selectedItems.length > 0 && getTotalQuantity() > 0;
  };

  const canProceedToStep3 = () => {
    const fullAddress = deliveryInfo.address.trim();
    if (isExpressDelivery) {
      return fullAddress !== '';
    }
    return deliveryInfo.date !== '' && deliveryInfo.time !== '' && fullAddress !== '';
  };

  const handleExpressDeliveryToggle = () => {
    setIsExpressDelivery(!isExpressDelivery);
    if (!isExpressDelivery) {
      setDeliveryInfo(prev => ({ ...prev, date: '', time: '' }));
    }
  };

  const getCurrentLocation = () => {
    const button = document.getElementById('location-btn');
    if (button) {
      button.textContent = 'Localisation...';
      button.disabled = true;
    }

    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par ce navigateur.');
      if (button) {
        button.textContent = 'Ma position';
        button.disabled = false;
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Try to get address from coordinates using reverse geocoding
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoidGhlaWNlZ3V5cyIsImEiOiJjbTRkZGNqZGcwMGNzMmtzZGNqZGNqZGNqIn0.example&country=ma&proximity=${longitude},${latitude}&types=address,poi`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const address = data.features[0].place_name;
              setDeliveryInfo(prev => ({
                ...prev,
                address: address,
                coordinates: [longitude, latitude]
              }));
            } else {
              throw new Error('No address found');
            }
          } else {
            throw new Error('Geocoding failed');
          }
        } catch (error) {
          console.error('Erreur de géocodage:', error);
          // Fallback: use coordinates as address
          const fallbackAddress = `Position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, Marrakech`;
          setDeliveryInfo(prev => ({
            ...prev,
            address: fallbackAddress,
            coordinates: [longitude, latitude]
          }));
        }
        
        // Reset button state
        if (button) {
          button.textContent = 'Ma position';
          button.disabled = false;
        }
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        let errorMessage = 'Impossible d\'obtenir votre position.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Accès à la localisation refusé. Veuillez autoriser la géolocalisation.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé pour la géolocalisation.';
            break;
        }
        
        alert(errorMessage);
        
        // Reset button state
        if (button) {
          button.textContent = 'Ma position';
          button.disabled = false;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const generateWhatsAppMessage = () => {
    let message = `🏠 *COMMANDE PARTICULIER - THE ICE GUYS*\n\n`;
    
    message += `📋 *DÉTAILS DE LA COMMANDE:*\n`;
    selectedItems.forEach(item => {
      const { iceType, quantities } = item;
      message += `\n🧊 *${iceType.name}*\n`;
      if (quantities['5kg'] > 0) message += `   • ${quantities['5kg']}x Sacs 5kg (${quantities['5kg'] * iceType.price5kg} MAD)\n`;
      if (quantities['10kg'] > 0) message += `   • ${quantities['10kg']}x Sacs 10kg (${quantities['10kg'] * iceType.price10kg} MAD)\n`;
      if (quantities['20kg'] > 0) message += `   • ${quantities['20kg']}x Sacs 20kg (${quantities['20kg'] * iceType.price20kg} MAD)\n`;
    });

    message += `\n🚚 *LIVRAISON:*\n`;
    if (isExpressDelivery) {
      message += `   • Type: Express (moins de 1H) - +100 MAD\n`;
    } else {
      message += `   • Type: Standard\n`;
      message += `   • Date: ${deliveryInfo.date}\n`;
      message += `   • Heure: ${deliveryInfo.time}\n`;
    }
    message += `   • Adresse: ${deliveryInfo.address}\n`;

    message += `\n👤 *INFORMATIONS CLIENT:*\n`;
    message += `   • Nom: ${customerInfo.name}\n`;
    message += `   • Téléphone: ${customerInfo.phone}\n`;
    message += `   • Email: ${customerInfo.email}\n`;
    if (customerInfo.notes) message += `   • Notes: ${customerInfo.notes}\n`;

    message += `\n💰 *TOTAL: ${calculateTotal()} MAD*\n`;
    message += `\n✅ Commande prête à être confirmée !`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppOrder = () => {
    const message = generateWhatsAppMessage();
    
    // Save order to database first, then send email and WhatsApp
    saveOrderToDatabase()
      .then(() => {
        // Send confirmation email
        sendOrderConfirmationEmail();
        
        // Open WhatsApp
        window.open(`https://wa.me/212693675981?text=${message}`, '_blank');
      })
      .catch((error) => {
        console.error('Erreur lors de la sauvegarde:', error);
        // Still allow WhatsApp even if database save fails
        alert('Commande envoyée mais non sauvegardée. Veuillez contacter le support.');
        window.open(`https://wa.me/212693675981?text=${message}`, '_blank');
      });
  };

  const saveOrderToDatabase = async () => {
    try {
      const orderData = {
        customer: {
          type: 'individual' as const,
          name: customerInfo.name,
          contact_name: null,
          phone: customerInfo.phone,
          email: customerInfo.email
        },
        order: {
          status: 'pending' as const,
          delivery_type: isExpressDelivery ? 'express' as const : 'standard' as const,
          delivery_date: isExpressDelivery ? null : deliveryInfo.date,
          delivery_time: isExpressDelivery ? null : deliveryInfo.time,
          delivery_address: deliveryInfo.address,
          delivery_coordinates: deliveryInfo.coordinates || null,
          notes: customerInfo.notes || null,
          subtotal: calculateTotal() - (isExpressDelivery ? 100 : 0),
          delivery_fee: isExpressDelivery ? 100 : 0,
          total: calculateTotal()
        },
        items: selectedItems.flatMap(item => {
          const items = [];
          if (item.quantities['5kg'] > 0) {
            items.push({
              ice_type: item.iceType.id as 'nuggets' | 'gourmet' | 'cubique',
              package_size: '5kg' as const,
              quantity: item.quantities['5kg'],
              unit_price: item.iceType.price5kg,
              total_price: item.quantities['5kg'] * item.iceType.price5kg
            });
          }
          if (item.quantities['10kg'] > 0) {
            items.push({
              ice_type: item.iceType.id as 'nuggets' | 'gourmet' | 'cubique',
              package_size: '10kg' as const,
              quantity: item.quantities['10kg'],
              unit_price: item.iceType.price10kg,
              total_price: item.quantities['10kg'] * item.iceType.price10kg
            });
          }
          if (item.quantities['20kg'] > 0) {
            items.push({
              ice_type: item.iceType.id as 'nuggets' | 'gourmet' | 'cubique',
              package_size: '20kg' as const,
              quantity: item.quantities['20kg'],
              unit_price: item.iceType.price20kg,
              total_price: item.quantities['20kg'] * item.iceType.price20kg
            });
          }
          return items;
        })
      };

      const savedOrder = await orderService.createOrder(orderData);
      console.log('Commande sauvegardée:', savedOrder);
      return savedOrder;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la commande:', error);
      throw error;
    }
  };

  const sendOrderConfirmationEmail = async () => {
    try {
      const orderData = {
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        orderDetails: {
          orderNumber: `CMD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          items: selectedItems.map(item => ({
            iceType: item.iceType.name,
            quantities: item.quantities,
            totalPrice: (item.quantities['5kg'] * item.iceType.price5kg) +
                       (item.quantities['10kg'] * item.iceType.price10kg) +
                       (item.quantities['20kg'] * item.iceType.price20kg)
          })),
          delivery: {
            type: isExpressDelivery ? 'express' : 'standard',
            date: deliveryInfo.date,
            time: deliveryInfo.time,
            address: deliveryInfo.address
          },
          total: calculateTotal(),
          customerType: 'individual'
        }
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        console.log('Email de confirmation envoyé avec succès');
      } else {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
    }
  };

  const steps = [
    { number: 1, title: 'Sélection', icon: Package },
    { number: 2, title: 'Livraison', icon: Truck },
    { number: 3, title: 'Informations', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour</span>
            </button>
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">Commande Professionnelle</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200"></div>
            <div 
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep >= step.number;
              const isCurrent = currentStep === step.number;
              
              return (
                <div key={step.number} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  } ${isCurrent ? 'scale-110 shadow-xl' : ''}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    isActive ? 'text-green-600' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Ice Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Choisissez vos glaçons</h2>
              <p className="text-slate-600">Sélectionnez les types et quantités pour votre événement ou usage personnel</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {iceTypes.map((iceType) => {
                const isSelected = selectedItems.some(item => item.iceType.id === iceType.id);
                const selectedItem = selectedItems.find(item => item.iceType.id === iceType.id);

                return (
                  <div 
                    key={iceType.id} 
                    onClick={() => handleIceTypeToggle(iceType)}
                    className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-xl ${
                    isSelected ? 'border-green-500 shadow-xl' : 'border-slate-200 hover:border-green-300'
                  }`}>
                   {/* Ice Type Image */}
                   <div className="aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 relative overflow-hidden rounded-t-xl">
                     <img 
                       src={iceType.image}
                       alt={iceType.name}
                       className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                     {isSelected && (
                       <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-2">
                         <Check className="h-5 w-5" />
                       </div>
                     )}
                   </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-900">{iceType.name}</h3>
                        <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                            isSelected 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-slate-300 hover:border-green-500'
                          }`}
                        >
                          {isSelected && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
                        </div>
                      </div>
                      
                      <p className="text-slate-600 text-sm mb-4">{iceType.description}</p>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center text-sm">
                          <span>Sac 5kg</span>
                          <span className="font-semibold">{iceType.price5kg} MAD</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Sac 20kg</span>
                          <span className="font-semibold">{iceType.price20kg} MAD</span>
                        </div>
                      </div>

                      {isSelected && selectedItem && (
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                          {(['5kg', '20kg'] as const).map((size) => (
                            <div key={size} className="flex items-center justify-between">
                              <span className="text-sm font-medium">Sacs {size}:</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(iceType.id, size, selectedItem.quantities[size] - 1);
                                  }}
                                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-semibold">{selectedItem.quantities[size]}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(iceType.id, size, selectedItem.quantities[size] + 1);
                                  }}
                                  className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedItems.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Récapitulatif de votre sélection</h3>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.iceType.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                      <div>
                        <span className="font-semibold">{item.iceType.name}</span>
                        <div className="text-sm text-slate-600">
                          {item.quantities['5kg'] > 0 && `${item.quantities['5kg']}x 5kg `}
                          {item.quantities['20kg'] > 0 && `${item.quantities['20kg']}x 20kg`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {(item.quantities['5kg'] * item.iceType.price5kg) +
                           (item.quantities['20kg'] * item.iceType.price20kg)} MAD
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 text-lg font-bold">
                    <span>Total:</span>
                    <span>{calculateTotal()} MAD</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton flottant pour continuer */}
            {canProceedToStep2() && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                <button
                  onClick={() => handleStepChange(2)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-semibold text-sm sm:text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3"
                >
                  <span className="text-center">
                    <span className="block sm:hidden">Continuer</span>
                    <span className="hidden sm:block">Continuer vers la livraison</span>
                  </span>
                  <div className="bg-white bg-opacity-20 rounded-full p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Delivery */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Informations de livraison</h2>
              <p className="text-slate-600">Choisissez votre mode de livraison et l'adresse</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Standard Delivery */}
              <div className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all cursor-pointer ${
                !isExpressDelivery ? 'border-green-500 shadow-xl' : 'border-slate-200 hover:border-green-300'
              }`} onClick={() => setIsExpressDelivery(false)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Truck className="h-6 w-6 text-green-600" />
                    <h3 className="text-xl font-bold text-slate-900">Livraison Standard</h3>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                    !isExpressDelivery ? 'bg-green-500 border-green-500' : 'border-slate-300'
                  }`}>
                    {!isExpressDelivery && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
                  </div>
                </div>
                <p className="text-slate-600 mb-2">Livraison programmée</p>
                <p className="text-sm text-slate-500">Choisissez votre créneau de livraison</p>
              </div>

              {/* Express Delivery */}
              <div className={`bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-lg p-6 border-2 transition-all cursor-pointer ${
                isExpressDelivery ? 'border-orange-400 shadow-xl' : 'border-orange-200 hover:border-orange-300'
              }`} onClick={handleExpressDeliveryToggle}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Rocket className="h-6 w-6 text-orange-600" />
                    <h3 className="text-xl font-bold text-slate-900">Livraison Express</h3>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                    isExpressDelivery ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                  }`}>
                    {isExpressDelivery && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
                  </div>
                </div>
                <p className="text-orange-700 font-semibold mb-2">Livrer en moins de 1H</p>
                <p className="text-sm text-orange-600 mb-2">Disponible de 8h à 23h</p>
                <div className="bg-orange-100 rounded-lg p-3">
                  <span className="text-orange-800 font-semibold">+100 MAD</span>
                </div>
              </div>
            </div>

            {/* Delivery Time Selection for Standard */}
            {!isExpressDelivery && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Planifiez votre livraison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date de livraison</label>
                    <input
                      type="date"
                      value={deliveryInfo.date}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Heure de livraison</label>
                    <select
                      value={deliveryInfo.time}
                      onChange={(e) => setDeliveryInfo(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Sélectionnez une heure</option>
                      <option value="08:00-10:00">08:00 - 10:00</option>
                      <option value="10:00-12:00">10:00 - 12:00</option>
                      <option value="12:00-14:00">12:00 - 14:00</option>
                      <option value="14:00-16:00">14:00 - 16:00</option>
                      <option value="16:00-18:00">16:00 - 18:00</option>
                      <option value="18:00-20:00">18:00 - 20:00</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Address Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Adresse de livraison</h3>
                <button
                  id="location-btn"
                  onClick={getCurrentLocation}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Ma position</span>
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Adresse complète *
                </label>
                <input
                  type="text"
                  value={deliveryInfo.address}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Entrez votre adresse complète (rue, quartier, ville)"
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 mt-0.5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Ville : Marrakech</p>
                      {deliveryInfo.address && (
                        <p className="text-slate-600 mt-1">
                          <strong>Adresse complète :</strong> {deliveryInfo.address}
                        </p>
                      )}
                      <p className="text-sm text-blue-700 mt-2">
                        ✅ Zone de livraison couverte
                      </p>
                      {deliveryInfo.coordinates && (
                        <p className="text-xs text-slate-500 mt-1">
                          📍 Position GPS enregistrée
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Updated Total */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total {isExpressDelivery ? '(avec livraison express)' : ''}:</span>
                <span>{calculateTotal()} MAD</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <button
                onClick={() => handleStepChange(1)}
                className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={() => handleStepChange(3)}
                disabled={!deliveryInfo.address || (!isExpressDelivery && (!deliveryInfo.date || !deliveryInfo.time))}
                className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold transition-all ${
                  (deliveryInfo.address && (isExpressDelivery || (deliveryInfo.date && deliveryInfo.time)))
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Continuer vers les informations
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Customer Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Vos informations</h2>
              <p className="text-slate-600">Complétez vos informations pour finaliser la commande</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet *</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Votre nom complet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes spéciales (optionnel)</label>
                <textarea
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  placeholder="Instructions spéciales, accès, étage, etc."
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Récapitulatif de la commande</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Produits commandés:</h4>
                  {selectedItems.map((item) => (
                    <div key={item.iceType.id} className="bg-slate-50 rounded-lg p-3 mb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{item.iceType.name}</span>
                          <div className="text-sm text-slate-600">
                            {item.quantities['5kg'] > 0 && `${item.quantities['5kg']}x 5kg (${item.quantities['5kg'] * item.iceType.price5kg} MAD) `}
                            {item.quantities['20kg'] > 0 && `${item.quantities['20kg']}x 20kg (${item.quantities['20kg'] * item.iceType.price20kg} MAD) `}
                          </div>
                        </div>
                        <div className="font-semibold">
                          {(item.quantities['5kg'] * item.iceType.price5kg) +
                           (item.quantities['20kg'] * item.iceType.price20kg)} MAD
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Livraison:</h4>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      {isExpressDelivery ? <Rocket className="h-4 w-4 text-orange-600" /> : <Truck className="h-4 w-4 text-green-600" />}
                      <span className="font-medium">
                        {isExpressDelivery ? 'Livraison Express (moins de 1H)' : 'Livraison Standard'}
                      </span>
                      {isExpressDelivery && <span className="text-orange-600 font-semibold">+100 MAD</span>}
                    </div>
                    {!isExpressDelivery && (
                      <div className="text-sm text-slate-600 mb-2">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {deliveryInfo.date} à {deliveryInfo.time}
                      </div>
                    )}
                    <div className="text-sm text-slate-600">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      {deliveryInfo.address}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">{calculateTotal()} MAD</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <button
                onClick={() => handleStepChange(2)}
                className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleWhatsAppOrder}
                disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.email}
                className={`w-full sm:w-auto px-8 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center space-x-3 ${
                  customerInfo.name && customerInfo.phone && customerInfo.email
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <MessageCircle className="h-6 w-6" />
                <span>Envoyer via WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

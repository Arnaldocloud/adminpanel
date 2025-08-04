'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form validation schema
const paymentMethods = {
  credit_card: 'credit_card',
  bank_transfer: 'bank_transfer',
  pago_movil: 'pago_movil'
} as const;

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Please enter a valid email' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  cedula: z.string().min(7, { message: 'Please enter a valid cedula' }),
  paymentMethod: z.enum([
    paymentMethods.credit_card, 
    paymentMethods.bank_transfer, 
    paymentMethods.pago_movil
  ], {
    required_error: 'Please select a payment method',
  }),
  referenceNumber: z.string().optional(),
  senderPhone: z.string().optional(),
  senderName: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type BingoCard = {
  id: string;
  card_number: number;
  price: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedCards, setSelectedCards] = useState<BingoCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: 'credit_card',
    },
  });

  const paymentMethod = watch('paymentMethod');

  // Load selected cards from session storage and ensure session ID exists
  useEffect(() => {
    const loadSelectedCards = async () => {
      try {
        setIsLoading(true);
        const storedCards = sessionStorage.getItem('selectedBingoCards');
        let storedSessionId = localStorage.getItem('bingo_session_id');
        
        // Generate a new session ID if it doesn't exist
        if (!storedSessionId) {
          storedSessionId = crypto.randomUUID();
          localStorage.setItem('bingo_session_id', storedSessionId);
        }
        setSessionId(storedSessionId);

        if (storedCards) {
          const parsedCards = JSON.parse(storedCards);
          setSelectedCards(parsedCards);
          
          // Pre-reserve the cards when the component mounts
          try {
            const reserveResponse = await fetch('/api/cards/reserve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cardIds: parsedCards.map((card: BingoCard) => card.id),
                guestId: storedSessionId,
              }),
            });

            if (!reserveResponse.ok) {
              const errorData = await reserveResponse.json();
              console.error('Initial reservation failed:', errorData);
              // We'll still let the user continue, as we'll retry later
            }
          } catch (error) {
            console.error('Error during initial reservation:', error);
          }
        } else {
          // No cards selected, redirect back to gallery
          router.push('/bingo-cards');
        }
      } catch (error) {
        console.error('Error loading selected cards:', error);
        router.push('/bingo-cards');
      } finally {
        setIsLoading(false);
      }
    };

    loadSelectedCards();
  }, [router]);

  const calculateTotal = () => {
    return selectedCards.reduce((sum, card) => sum + (card.price || 0), 0);
  };

  const handleGoBack = () => {
    router.back();
  };

  const onSubmit = async (data: FormData) => {
    if (selectedCards.length === 0) {
      toast({
        title: 'No cards selected',
        description: 'Please select bingo cards before checking out.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    let retryCount = 0;
    const maxRetries = 2;

    const attemptPurchase = async (attempt: number): Promise<boolean> => {
      try {
        // First, reserve the cards if not already reserved
        const reserveResponse = await fetch('/api/cards/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardIds: selectedCards.map(card => card.id),
            guestId: sessionId,
          }),
        });

        if (!reserveResponse.ok) {
          const errorData = await reserveResponse.json();
          throw new Error(errorData.error || 'Failed to reserve cards');
        }

        // Then, create the purchase order
        const purchaseResponse = await fetch('/api/cards/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardIds: selectedCards.map(card => card.id),
            sessionId,
            paymentMethod: data.paymentMethod,
            paymentDetails: {
              referenceNumber: data.referenceNumber,
              senderPhone: data.senderPhone,
              senderName: data.senderName,
            },
            customerInfo: {
              name: data.fullName,
              email: data.email,
              phone: data.phone,
              cedula: data.cedula,
            },
          }),
        });

        const result = await purchaseResponse.json();

        if (!purchaseResponse.ok) {
          throw new Error(result.error || 'Failed to complete purchase');
        }

        // Clear the selected cards from session storage
        sessionStorage.removeItem('selectedBingoCards');
        
        // Mark order as successful
        setOrderSuccess(true);
        
        // Show success message
        toast({
          title: 'Purchase Successful!',
          description: 'Your bingo cards have been purchased successfully.',
        });

        return true;
      } catch (error) {
        console.error(`Purchase attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          return attemptPurchase(attempt + 1);
        }
        
        throw error;
      }
    };

    try {
      await attemptPurchase(0);
    } catch (error) {
      console.error('All purchase attempts failed:', error);
      
      toast({
        title: 'Checkout Failed',
        description: error instanceof Error ? error.message : 'An error occurred during checkout. Please try again.',
        variant: 'destructive',
        action: (
          <Button variant="outline" onClick={() => onSubmit(data)}>
            Retry
          </Button>
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="container mx-auto py-12 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
            <CardDescription>
              Thank you for your purchase. Your bingo cards are now available in your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Order Summary</h3>
              <div className="space-y-2">
                {selectedCards.map((card) => (
                  <div key={card.id} className="flex justify-between">
                    <span>Bingo Card #{card.card_number}</span>
                    <span>${card.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 font-medium">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your email address.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/bingo-cards')}>
              View My Bingo Cards
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        onClick={handleGoBack}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
      </Button>

      <h1 className="text-3xl font-bold mb-2">Checkout</h1>
      <p className="text-muted-foreground mb-8">Complete your purchase</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      placeholder="John Doe" 
                      {...register('fullName')} 
                      className={errors.fullName ? 'border-red-500' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-500">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your@email.com" 
                      {...register('email')} 
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    placeholder="+58 412 1234567" 
                    {...register('phone')} 
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cedula">Cedula</Label>
                  <Input 
                    id="cedula" 
                    placeholder="V-12345678" 
                    {...register('cedula')} 
                    className={errors.cedula ? 'border-red-500' : ''}
                  />
                  {errors.cedula && (
                    <p className="text-sm text-red-500">{errors.cedula.message}</p>
                  )}
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="font-medium">Payment Method</h3>
                  <RadioGroup 
                    defaultValue="credit_card" 
                    className="space-y-4"
                    {...register('paymentMethod')}
                  >
                    <div className="flex items-center space-x-3 border rounded-lg p-4">
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <div className="flex-1">
                        <Label htmlFor="credit_card" className="font-normal">
                          Credit/Debit Card
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pay with Visa, Mastercard, or other credit/debit cards
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-4">
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <div className="flex-1">
                        <Label htmlFor="bank_transfer" className="font-normal">
                          Bank Transfer
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Transfer from your bank account
                        </p>
                        {paymentMethod === 'bank_transfer' && (
                          <div className="mt-2 space-y-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Reference Number</Label>
                              <Input 
                                placeholder="Enter reference number" 
                                {...register('referenceNumber', { required: 'Reference number is required' })}
                                className="max-w-xs"
                              />
                              {errors.referenceNumber && (
                                <p className="text-sm text-red-500">{errors.referenceNumber.message}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-4">
                      <RadioGroupItem value="pago_movil" id="pago_movil" />
                      <div className="flex-1">
                        <Label htmlFor="pago_movil" className="font-normal">
                          Pago Móvil
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pay using Pago Móvil service
                        </p>
                        {paymentMethod === 'pago_movil' && (
                          <div className="mt-2 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Reference Number</Label>
                                <Input 
                                  placeholder="Reference number" 
                                  {...register('referenceNumber', { required: 'Reference number is required' })}
                                />
                                {errors.referenceNumber && (
                                  <p className="text-sm text-red-500">{errors.referenceNumber.message}</p>
                                )}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Sender Phone</Label>
                                <Input 
                                  placeholder="Sender phone" 
                                  {...register('senderPhone', { required: 'Sender phone is required' })}
                                />
                                {errors.senderPhone && (
                                  <p className="text-sm text-red-500">{errors.senderPhone.message}</p>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Sender Name</Label>
                              <Input 
                                placeholder="Sender name" 
                                {...register('senderName', { required: 'Sender name is required' })}
                              />
                              {errors.senderName && (
                                <p className="text-sm text-red-500">{errors.senderName.message}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay $${calculateTotal().toFixed(2)}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                {selectedCards.length} {selectedCards.length === 1 ? 'item' : 'items'} in your order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {selectedCards.map((card) => (
                  <div key={card.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">Bingo Card #{card.card_number}</p>
                    </div>
                    <span>${card.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Secure Checkout</AlertTitle>
            <AlertDescription className="text-xs">
              Your payment information is encrypted and secure. We do not store your credit card details.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}

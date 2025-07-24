"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Copy, Check, Upload } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"

export default function PaymentDetailsPage({ params }: { params: { type: string, method: string } }) {
  const router = useRouter()
  const [copied, setCopied] = useState({ field: '', status: false })
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Sample data including Sterling Bank
  const sampleData = {
    bank: {
      sterling: {
        name: "Sterling Bank",
        accountNumber: "0100563493",
        accountName: "Ebuka Nwite",
        logo: "/images/sterling-logo.jpg",
        instructions: "Transfer the exact amount to this account. Payment will be verified within 30 minutes. Include your email as reference.",
        status: "fast",
        statusColor: "text-green-600 bg-green-100"
      },
      kuda: {
        name: "KUDA MFB",
        accountNumber: "2076219357",
        accountName: "Nwite Sabastine Ebuka",
        logo: "/images/kuda-logo.jpg",
        instructions: "Send exact amount to this account. Payment will be processed within 1 hour of confirmation."
      },
      opay: {
        name: "OPAY Bank",
        accountNumber: "6102567496",
        accountName: "Ebuka Sabastine",
        logo: "/images/opay-logo.jpg",
        instructions: "Fast transfer recommended. Payment processed within 15 minutes."
      }
    },
    digital: {
      paypal: {
        name: "PayPal",
        email: "payments@yourcompany.com",
        logo: "https://logos-download.com/wp-content/uploads/2016/03/PayPal_logo_logotype_emblem.png",
        instructions: "Send as Friends & Family to avoid fees. Include your email in the notes."
      }
    },
    crypto: {
      usdt: {
        name: "USDT (TRC20)",
        address: "TXYZ1234567890abcdef",
        network: "TRON (TRC20)",
        logo: "https://cryptologos.cc/logos/tether-usdt-logo.png",
        instructions: "Send only USDT via TRC20 network. Other coins or networks will be lost."
      },
      btc: {
        name: "Bitcoin",
        address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        network: "Bitcoin",
        logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
        instructions: "Send only BTC to this address. Confirm network before sending."
      }
    }
  }

  useEffect(() => {
    // Get payment details from localStorage or API
    const stored = localStorage.getItem("paygo-selected-payment")
    if (stored) {
      setPaymentDetails(JSON.parse(stored))
    } else {
      // Fallback to sample data based on route params
      const details = sampleData[params.type as keyof typeof sampleData]?.[params.method]
      if (details) {
        setPaymentDetails({
          ...details,
          id: params.method,
          type: params.type
        })
      } else {
        router.push("/buy-pay-id")
      }
    }
  }, [params])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied({ field, status: true })
    setTimeout(() => setCopied({ field: '', status: false }), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (!paymentDetails) {
    return (
      <div className="flex items-center justify-center h-screen bg-purple-50">
        <div className="animate-pulse text-purple-600">Loading payment details...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-50 pb-20">
      {/* Header */}
      <header className="bg-purple-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-1 rounded-full hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Payment Details</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          {/* Payment Method Logo */}
          <div className="mx-auto w-20 h-20 relative mb-4">
            <Image
              src={paymentDetails.logo}
              alt={paymentDetails.name}
              fill
              className="object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg"
              }}
            />
          </div>
          
          <h2 className="text-xl font-bold text-purple-800 mb-2">{paymentDetails.name}</h2>
          {paymentDetails.status && (
            <span className={`text-xs px-2 py-1 rounded-full ${paymentDetails.statusColor} inline-block mb-3`}>
              {paymentDetails.status}
            </span>
          )}
          <p className="text-gray-500 mb-6">Follow the instructions below to complete your payment</p>
          
          {/* Payment Details Card */}
          <div className="bg-purple-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-purple-700 mb-3">Send To:</h3>
            
            {paymentDetails.type === 'bank' && (
              <>
                <div className="mb-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Account Name</p>
                    <button 
                      onClick={() => copyToClipboard(paymentDetails.accountName, 'accountName')}
                      className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      {copied.field === 'accountName' && copied.status ? (
                        <>
                          <Check size={16} /> <span className="text-xs">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> <span className="text-xs">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-medium">{paymentDetails.accountName}</p>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Account Number</p>
                    <button 
                      onClick={() => copyToClipboard(paymentDetails.accountNumber, 'accountNumber')}
                      className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      {copied.field === 'accountNumber' && copied.status ? (
                        <>
                          <Check size={16} /> <span className="text-xs">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> <span className="text-xs">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-medium">{paymentDetails.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium">{paymentDetails.name}</p>
                </div>
              </>
            )}

            {paymentDetails.type === 'digital' && (
              <>
                <div className="mb-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Email Address</p>
                    <button 
                      onClick={() => copyToClipboard(paymentDetails.email, 'email')}
                      className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      {copied.field === 'email' && copied.status ? (
                        <>
                          <Check size={16} /> <span className="text-xs">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> <span className="text-xs">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-medium">{paymentDetails.email}</p>
                </div>
              </>
            )}

            {paymentDetails.type === 'crypto' && (
              <>
                <div className="mb-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Wallet Address</p>
                    <button 
                      onClick={() => copyToClipboard(paymentDetails.address, 'address')}
                      className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      {copied.field === 'address' && copied.status ? (
                        <>
                          <Check size={16} /> <span className="text-xs">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> <span className="text-xs">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-medium break-all text-left">{paymentDetails.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Network</p>
                  <p className="font-medium">{paymentDetails.network}</p>
                </div>
              </>
            )}
          </div>

          {/* Amount Card */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-700 mb-1">Amount to Send</h3>
            <p className="text-2xl font-bold">₦7,250</p>
            {paymentDetails.type === 'crypto' && (
              <p className="text-sm text-gray-500 mt-1">~0.00034 BTC</p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-blue-700 mb-2">Important Instructions</h3>
            <p className="text-sm text-gray-700">{paymentDetails.instructions}</p>
          </div>

          {/* Payment Evidence Upload */}
          <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Upload Payment Evidence</h3>
            
            {preview ? (
              <div className="mb-3">
                <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2">
                  <Image
                    src={preview}
                    alt="Payment evidence preview"
                    fill
                    className="object-contain"
                  />
                </div>
                <button 
                  onClick={() => {
                    setPreview(null)
                    setFile(null)
                  }}
                  className="text-red-600 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={triggerFileInput}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload screenshot</p>
                <p className="text-xs text-gray-400">PNG, JPG (Max 5MB)</p>
              </button>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => router.push("/payment-confirmation")}
              disabled={!file}
              className={`py-3 rounded-lg font-medium transition-colors ${
                file 
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Submit Payment Evidence
            </button>
            <button 
              onClick={() => router.back()}
              className="border border-purple-600 text-purple-600 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              Choose Another Method
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
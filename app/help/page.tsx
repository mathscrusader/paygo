"use client"

import Link from "next/link"
import { ArrowLeft, HelpCircle } from "lucide-react"
import { Logo } from "@/components/logo"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

const faqs = [
  {
    question: "What is PayGo?",
    answer:
      "PayGo is a financial services platform that allows users to purchase airtime and data, withdraw funds, and manage digital transactions.",
  },
  {
    question: "How do I withdraw my funds?",
    answer:
      "To withdraw funds, you need to purchase a PAY ID first. Once you have a PAY ID, you can go to the Withdraw page, enter your bank details, and submit your withdrawal request.",
  },
  {
    question: "What is a PAY ID?",
    answer:
      "A PAY ID is a unique identifier that allows you to withdraw funds from your PayGo account. You can purchase a PAY ID for ₦7,250 from the Buy PAY ID page. And when you're making payment for Your PAY ID make sure you add Payment description (PayGo-PAY ID) to verify your Payment easily.",
  },
  {
    question: "How do I purchase airtime or data?",
    answer:
      "Go to the Airtime or Data page from the dashboard, select your network provider, enter the phone number, choose a plan, enter your PAY ID, and complete the purchase.",
  },
  {
    question: "Is my welcome bonus real?",
    answer: "Yes, all new users receive a welcome bonus of ₦180,000 which can be withdrawn after purchasing a PAY ID.",
  },
]

export default function HelpPage() {
  const handleContactSupport = () => {
    // Create WhatsApp URL with phone number and pre-filled message
    const phoneNumber = "2349113585676" // Remove the + as it's added in the URL format
    const message = encodeURIComponent("Hello, I need help with PayGo app.")
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Help Center</span>
        </Link>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex justify-center mb-6">
          <Logo className="w-64 hover:scale-110 transition-transform duration-300" />
        </div>

        <h2 className="text-2xl font-bold text-center text-purple-800 flex items-center justify-center gap-2">
          <HelpCircle className="h-6 w-6" />
          How can we help?
        </h2>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">Still need help?</p>
          <Button onClick={handleContactSupport} className="bg-green-600 hover:bg-green-700 text-white">
            Contact our support team
          </Button>
        </div>
      </div>
    </div>
  )
}

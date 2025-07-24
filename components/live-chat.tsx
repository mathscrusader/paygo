"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: number
  text: string
  sender: "user" | "agent"
  timestamp: Date
}

interface LiveChatProps {
  onClose: () => void
}

export function LiveChat({ onClose }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! How can I help you today? Feel free to ask any questions about the PayGo app.",
      sender: "agent",
      timestamp: new Date(),
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [isWaiting, setIsWaiting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: newMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setNewMessage("")
    setIsWaiting(true)

    // Generate a relevant response based on the user's message
    const response = generateResponse(newMessage)

    // Simulate agent response after a delay
    setTimeout(() => {
      const agentMessage: Message = {
        id: messages.length + 2,
        text: response,
        sender: "agent",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, agentMessage])
      setIsWaiting(false)
    }, 1500)
  }

  const generateResponse = (userMessage: string) => {
    const message = userMessage.toLowerCase()

    // PAY ID related questions
    if (message.includes("pay id") || message.includes("payid")) {
      if (message.includes("cost") || message.includes("price") || message.includes("how much")) {
        return "The PAY ID costs ₦7,250. You can purchase it from the Buy PAY ID option on your dashboard."
      }
      if (message.includes("what is") || message.includes("purpose")) {
        return "A PAY ID is a unique identifier that allows you to withdraw funds from your PayGo account and make transactions. It's a one-time purchase that unlocks all the features of the app."
      }
      if (message.includes("buy") || message.includes("purchase") || message.includes("get")) {
        return "To buy a PAY ID, go to your dashboard and tap on 'Buy PAY ID'. Follow the instructions to make a payment of ₦7,250. Once your payment is confirmed, your PAY ID will be activated."
      }
      return "The PAY ID is essential for withdrawals and transactions on PayGo. It costs ₦7,250 and is a one-time purchase. You can buy it from the dashboard by selecting 'Buy PAY ID'."
    }

    // Withdrawal related questions
    if (
      message.includes("withdraw") ||
      message.includes("cash out") ||
      message.includes("take out money") ||
      message.includes("get my money")
    ) {
      if (message.includes("how") || message.includes("process")) {
        return "To withdraw funds, you need a PAY ID first. Then go to the dashboard, tap 'Withdraw', enter your bank details and PAY ID, and submit your request. The funds will be sent to your bank account."
      }
      if (message.includes("time") || message.includes("long") || message.includes("when")) {
        return "Withdrawals are typically processed within 24 hours after submission. Make sure you've entered the correct bank details to avoid delays."
      }
      if (message.includes("fee") || message.includes("charge")) {
        return "There are no withdrawal fees. The full amount you request will be sent to your bank account."
      }
      return "To withdraw funds, you need a PAY ID. Go to the Withdraw section from your dashboard, enter your bank details, and submit your request. The funds will be sent to your bank account within 24 hours."
    }

    // Loan related questions
    if (message.includes("loan")) {
      if (message.includes("how") || message.includes("apply") || message.includes("get")) {
        return "To apply for a loan, go to the 'Loan' section on your dashboard. You can borrow between ₦100,000 and ₦250,000. We offer two types of loans: Free Loan (no repayment required) and SLF (requires a 5% processing fee)."
      }
      if (message.includes("repay") || message.includes("pay back")) {
        return "For Free Loans, no repayment is required. For SLF loans, you only pay a 5% processing fee upfront, and the loan principal doesn't need to be repaid."
      }
      if (message.includes("interest") || message.includes("fee")) {
        return "Free Loans have no interest or fees. SLF loans require a 5% processing fee upfront, but no interest is charged and the principal doesn't need to be repaid."
      }
      return "PayGo offers loans between ₦100,000 and ₦250,000. We have Free Loans (no repayment) and SLF loans (5% processing fee). You can apply from the Loan section on your dashboard."
    }

    // Referral related questions
    if (message.includes("refer") || message.includes("invite") || message.includes("friend")) {
      if (message.includes("how") || message.includes("work")) {
        return "Our referral program lets you earn ₦500 for each friend who signs up using your referral link and purchases a PAY ID. You can share your link via WhatsApp or copy it to share on other platforms."
      }
      if (message.includes("withdraw") || message.includes("get") || message.includes("cash out")) {
        return "Referral earnings can be withdrawn every Saturday between 12:00 PM and 3:00 PM. Go to the Refer page, click 'Withdraw Earnings', and enter your bank details."
      }
      return "You can earn ₦500 for each friend who joins PayGo using your referral link and purchases a PAY ID. Go to the Refer section on your dashboard to get your referral link and track your earnings."
    }

    // Balance related questions
    if (
      message.includes("balance") ||
      message.includes("account") ||
      message.includes("money") ||
      message.includes("bonus")
    ) {
      if (message.includes("welcome") || message.includes("bonus") || message.includes("initial")) {
        return "All new users receive a welcome bonus of ₦180,000 which can be withdrawn after purchasing a PAY ID. This is our way of welcoming you to PayGo!"
      }
      if (message.includes("check") || message.includes("see") || message.includes("view")) {
        return "Your current balance is displayed at the top of your dashboard. It shows both your available balance and weekly rewards."
      }
      return "Your account balance is shown on your dashboard. New users receive a welcome bonus of ₦180,000 which can be withdrawn after purchasing a PAY ID."
    }

    // Airtime and data related questions
    if (message.includes("airtime") || message.includes("data") || message.includes("recharge")) {
      if (message.includes("buy") || message.includes("purchase") || message.includes("get")) {
        return "To buy airtime or data, go to the respective section on your dashboard, select your network provider, enter the phone number, choose the amount/plan, enter your PAY ID, and complete the purchase."
      }
      if (message.includes("network") || message.includes("provider")) {
        return "PayGo supports all major network providers including MTN, Airtel, Glo, and 9mobile for both airtime and data purchases."
      }
      return "You can buy airtime and data for all major networks through PayGo. Just select the appropriate option from your dashboard, enter the details, and complete your purchase using your PAY ID."
    }

    // General app questions
    if (message.includes("app") || message.includes("paygo") || message.includes("service")) {
      if (message.includes("about") || message.includes("what is")) {
        return "PayGo is a financial services platform that allows you to purchase airtime and data, withdraw funds, apply for loans, and manage digital transactions. We offer a ₦180,000 welcome bonus to all new users."
      }
      if (message.includes("feature") || message.includes("offer") || message.includes("do")) {
        return "PayGo offers multiple services including airtime and data purchases, fund withdrawals, loans, referral earnings, and more. All these features are accessible from your dashboard after logging in."
      }
      return "PayGo is your all-in-one financial services app. We offer airtime and data purchases, withdrawals, loans, and a referral program. New users get a ₦180,000 welcome bonus that can be withdrawn after purchasing a PAY ID."
    }

    // Account related questions
    if (message.includes("account") || message.includes("profile") || message.includes("login")) {
      if (message.includes("create") || message.includes("register") || message.includes("sign up")) {
        return "To create an account, go to the registration page, enter your name, email, and password. You'll receive a ₦180,000 welcome bonus upon registration."
      }
      if (message.includes("login") || message.includes("sign in")) {
        return "To login, enter your registered email and password on the login page. If you've forgotten your password, you can reset it using the 'Forgot Password' option."
      }
      return "Your PayGo account gives you access to all our services. You can manage your profile from the dashboard. If you have any issues with your account, please contact our support team."
    }

    // Default responses for unrecognized queries
    const defaultResponses = [
      "Thank you for your question. I'd be happy to help with that. Could you provide a bit more detail so I can give you the most accurate information?",
      "I appreciate your inquiry. To better assist you, could you clarify what specific aspect of PayGo you're asking about?",
      "I'm here to help with any questions about PayGo. Could you please elaborate a bit more on your question?",
      "Thanks for reaching out. I want to make sure I provide the right information. Could you rephrase your question or provide more details?",
      "I'm not quite sure I understand your question. Could you please provide more details so I can better assist you?",
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full h-[80vh] flex flex-col">
        {/* Chat Header */}
        <div className="bg-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h3 className="font-bold">PayGo Support</h3>
            <p className="text-xs text-purple-200">We typically reply in a few minutes</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-purple-200">
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === "user"
                    ? "bg-purple-600 text-white rounded-tr-none"
                    : "bg-gray-100 text-gray-800 rounded-tl-none"
                }`}
              >
                <p>{message.text}</p>
                <p className={`text-xs mt-1 ${message.sender === "user" ? "text-purple-200" : "text-gray-500"}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isWaiting && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-lg rounded-tl-none max-w-[80%] p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <p className="text-sm text-gray-500">Agent is typing...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isWaiting || !newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

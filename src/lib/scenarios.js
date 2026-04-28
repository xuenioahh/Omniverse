import { Plane, Building2, Hotel, UtensilsCrossed, ShoppingBag, Stethoscope, GraduationCap, Briefcase, Phone, Car, Landmark, Coffee } from "lucide-react";

export const SCENARIOS = [
  {
    id: "airport",
    title: "Airport",
    subtitle: "Navigate check-in & boarding",
    icon: Plane,
    color: "from-violet-500 to-indigo-600",
    aiRole: "Airport Gate Agent",
    aiVoice: "female",
    goalOriented: {
      userRole: "Business traveler rushing to London",
      goal: "Find out new departure time and rebooking options",
      context: "You are at London Heathrow Airport. Your flight BA123 to New York has been delayed due to weather. You need to speak with the gate agent to find out the new departure time and possible connections.",
      firstMessage: "Good morning! How can I assist you with your flight today?",
      successCriteria: "Get new departure time and confirm rebooking"
    },
    freeTalk: {
      userRole: "Airport traveler",
      topic: "Travel experiences and airport services",
      context: "You're at an international airport waiting for your flight. Chat with the friendly gate agent about anything travel-related.",
      firstMessage: "Hello there! Welcome to the airport. Is this your first time flying internationally?"
    }
  },
  {
    id: "bank",
    title: "Bank",
    subtitle: "Handle financial transactions",
    icon: Building2,
    color: "from-emerald-500 to-teal-600",
    aiRole: "Bank Teller",
    aiVoice: "male",
    goalOriented: {
      userRole: "Customer opening a new account",
      goal: "Open a savings account and understand interest rates",
      context: "You've just moved to a new city and need to open a bank account. You want to compare savings account options and understand the interest rates and fees.",
      firstMessage: "Welcome to First National Bank! How can I help you today?",
      successCriteria: "Open account and understand rates"
    },
    freeTalk: {
      userRole: "Bank customer",
      topic: "Banking services and financial planning",
      context: "You're visiting your local bank branch. Feel free to discuss any banking topics.",
      firstMessage: "Good afternoon! Thanks for coming in. What brings you to the bank today?"
    }
  },
  {
    id: "hotel",
    title: "Hotel",
    subtitle: "Check-in & room service",
    icon: Hotel,
    color: "from-amber-500 to-orange-600",
    aiRole: "Hotel Receptionist",
    aiVoice: "female",
    goalOriented: {
      userRole: "Guest who lost room key",
      goal: "Get a replacement key card and confirm checkout time",
      context: "You're staying at a luxury hotel and have lost your room key card. You need to get a replacement and also want to confirm the checkout time for tomorrow.",
      firstMessage: "Good evening! Welcome to the Grand Hotel. How may I assist you?",
      successCriteria: "Get replacement key and checkout time"
    },
    freeTalk: {
      userRole: "Hotel guest",
      topic: "Hotel amenities and local attractions",
      context: "You've just checked into a nice hotel. Chat with the receptionist about the hotel and the local area.",
      firstMessage: "Welcome! I hope you're enjoying your stay so far. Is there anything you'd like to know about our hotel or the area?"
    }
  },
  {
    id: "restaurant",
    title: "Restaurant",
    subtitle: "Order food & dine out",
    icon: UtensilsCrossed,
    color: "from-rose-500 to-pink-600",
    aiRole: "Restaurant Waiter",
    aiVoice: "male",
    goalOriented: {
      userRole: "Diner with dietary restrictions",
      goal: "Order a meal accommodating your nut allergy",
      context: "You're at a nice Italian restaurant for dinner. You have a severe nut allergy and need to ensure your meal is safe. You also want to order wine.",
      firstMessage: "Good evening! Welcome to Bella Italia. Can I start you off with something to drink?",
      successCriteria: "Order safe meal and wine"
    },
    freeTalk: {
      userRole: "Restaurant customer",
      topic: "Food, cuisine, and dining experiences",
      context: "You're dining at a popular restaurant. Chat with the waiter about the menu and food in general.",
      firstMessage: "Hi there! Thanks for choosing us tonight. Have you dined with us before?"
    }
  },
  {
    id: "shopping",
    title: "Shopping",
    subtitle: "Browse & purchase items",
    icon: ShoppingBag,
    color: "from-cyan-500 to-blue-600",
    aiRole: "Sales Associate",
    aiVoice: "female",
    goalOriented: {
      userRole: "Customer returning a defective product",
      goal: "Return item and get a refund or exchange",
      context: "You bought a laptop last week and it has a screen defect. You want to return it and either get a refund or exchange it for a working one.",
      firstMessage: "Hi! Welcome to TechMart. How can I help you today?",
      successCriteria: "Successfully process return/exchange"
    },
    freeTalk: {
      userRole: "Shopper",
      topic: "Shopping preferences and product recommendations",
      context: "You're browsing at an electronics store. Chat with the sales associate about products and deals.",
      firstMessage: "Hey! Looking for anything specific today, or just browsing?"
    }
  },
  {
    id: "hospital",
    title: "Hospital",
    subtitle: "Medical consultations",
    icon: Stethoscope,
    color: "from-red-500 to-rose-600",
    aiRole: "Doctor",
    aiVoice: "male",
    goalOriented: {
      userRole: "Patient with recurring headaches",
      goal: "Describe symptoms and understand treatment options",
      context: "You've been having frequent headaches for the past two weeks. They're worse in the morning and sometimes come with dizziness. You want to understand what's causing them.",
      firstMessage: "Hello! I'm Dr. Smith. Please have a seat. What brings you in today?",
      successCriteria: "Describe symptoms and get treatment plan"
    },
    freeTalk: {
      userRole: "Patient",
      topic: "Health, wellness, and medical advice",
      context: "You're at a routine check-up. Feel free to discuss any health concerns.",
      firstMessage: "Good morning! How have you been feeling lately? Any health concerns you'd like to discuss?"
    }
  },
  {
    id: "university",
    title: "University",
    subtitle: "Academic discussions",
    icon: GraduationCap,
    color: "from-purple-500 to-violet-600",
    aiRole: "Academic Advisor",
    aiVoice: "female",
    goalOriented: {
      userRole: "Student planning course schedule",
      goal: "Register for classes and understand requirements",
      context: "You're a sophomore planning next semester's courses. You need to fulfill your major requirements and want advice on electives.",
      firstMessage: "Hi! Welcome to the advising office. Let's look at your academic plan. What's your major?",
      successCriteria: "Plan course schedule with requirements met"
    },
    freeTalk: {
      userRole: "University student",
      topic: "Academic life, career planning, and campus activities",
      context: "You're meeting with your academic advisor. Discuss anything about your studies.",
      firstMessage: "Hey! Good to see you. How's the semester going so far?"
    }
  },
  {
    id: "office",
    title: "Office",
    subtitle: "Workplace interactions",
    icon: Briefcase,
    color: "from-slate-500 to-gray-600",
    aiRole: "Team Manager",
    aiVoice: "male",
    goalOriented: {
      userRole: "Employee requesting time off",
      goal: "Request two weeks of vacation and arrange coverage",
      context: "You want to take two weeks off next month for a family trip. You need to discuss coverage with your manager and get approval.",
      firstMessage: "Come on in! I saw you wanted to chat. What's on your mind?",
      successCriteria: "Get vacation approved with coverage plan"
    },
    freeTalk: {
      userRole: "Office worker",
      topic: "Work projects, career development, and office life",
      context: "You're having a casual catch-up with your team manager. Talk about anything work-related.",
      firstMessage: "Hey! Grab a coffee and sit down. How are things going with your projects?"
    }
  },
  {
    id: "phone",
    title: "Phone Call",
    subtitle: "Customer service calls",
    icon: Phone,
    color: "from-indigo-500 to-blue-600",
    aiRole: "Customer Service Rep",
    aiVoice: "female",
    goalOriented: {
      userRole: "Customer with billing issue",
      goal: "Resolve incorrect charge on your phone bill",
      context: "Your phone bill has an extra $50 charge you don't recognize. You need to call customer service to dispute it and get it removed.",
      firstMessage: "Thank you for calling TeleCom support. My name is Sarah. How can I help you today?",
      successCriteria: "Get incorrect charge removed"
    },
    freeTalk: {
      userRole: "Phone customer",
      topic: "Phone plans, services, and technology",
      context: "You're on a call with customer service about your phone plan. Discuss anything related.",
      firstMessage: "Hi, thanks for calling! How can I make your day better?"
    }
  },
  {
    id: "car_rental",
    title: "Car Rental",
    subtitle: "Rent & return vehicles",
    icon: Car,
    color: "from-yellow-500 to-amber-600",
    aiRole: "Rental Agent",
    aiVoice: "male",
    goalOriented: {
      userRole: "Tourist renting a car for road trip",
      goal: "Rent suitable car with insurance for a week-long trip",
      context: "You're on vacation and want to rent a car for a week-long road trip along the coast. You need GPS and want to understand the insurance options.",
      firstMessage: "Welcome to QuickRent! Planning a trip? Let me help you find the perfect vehicle.",
      successCriteria: "Rent car with insurance and GPS"
    },
    freeTalk: {
      userRole: "Car rental customer",
      topic: "Road trips, car preferences, and travel plans",
      context: "You're at a car rental counter. Chat about cars and travel plans.",
      firstMessage: "Hey! Great day for a drive. Are you here for business or pleasure?"
    }
  },
  {
    id: "museum",
    title: "Museum",
    subtitle: "Art & culture discussions",
    icon: Landmark,
    color: "from-teal-500 to-emerald-600",
    aiRole: "Museum Guide",
    aiVoice: "female",
    goalOriented: {
      userRole: "Art student studying Impressionism",
      goal: "Learn about three key Impressionist paintings",
      context: "You're visiting the museum for a class assignment on Impressionism. You need to learn about specific paintings, their artists, and techniques used.",
      firstMessage: "Welcome to the National Gallery! I'll be your guide today. Are you interested in any particular art period?",
      successCriteria: "Learn about 3 Impressionist works"
    },
    freeTalk: {
      userRole: "Museum visitor",
      topic: "Art, history, and cultural exhibits",
      context: "You're visiting a museum on the weekend. Enjoy a casual conversation with the guide.",
      firstMessage: "Welcome! This is a wonderful time to visit. We have some exciting new exhibits. What catches your eye?"
    }
  },
  {
    id: "cafe",
    title: "Café",
    subtitle: "Casual conversations",
    icon: Coffee,
    color: "from-orange-500 to-red-600",
    aiRole: "Barista",
    aiVoice: "female",
    goalOriented: {
      userRole: "Customer ordering for a meeting",
      goal: "Order coffee and pastries for a group of 5 colleagues",
      context: "You need to order drinks and snacks for a team meeting. You need 5 different drinks and some pastries, and one colleague is lactose intolerant.",
      firstMessage: "Hey! Welcome to Brew & Bean! What can I get started for you?",
      successCriteria: "Order all 5 drinks and suitable pastries"
    },
    freeTalk: {
      userRole: "Café customer",
      topic: "Coffee culture, daily life, and casual chat",
      context: "You're at your favorite local café. Have a relaxed chat with the barista.",
      firstMessage: "Morning! You look like you could use a good cup of coffee. Regular or feeling adventurous today?"
    }
  }
];

export function getScenario(id) {
  return SCENARIOS.find(s => s.id === id);
}
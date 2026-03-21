"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

type Language = 'en' | 'hi'

interface Translations {
  [key: string]: {
    en: string
    hi: string
  }
}

const translations: Translations = {
  // Navigation
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.report': { en: 'Report', hi: 'रिपोर्ट' },
  'nav.communication': { en: 'Communication', hi: 'संचार' },
  'nav.analytics': { en: 'Analytics', hi: 'विश्लेषण' },
  
  // Landing Page
  'landing.headline': { en: 'Accelerated Emergency Response in Hospitality', hi: 'आतिथ्य में त्वरित आपातकालीन प्रतिक्रिया' },
  'landing.description': { en: 'Coordinate crisis response in real-time. Protect your guests, staff, and property with our intelligent emergency management platform.', hi: 'वास्तविक समय में संकट प्रतिक्रिया समन्वय करें। हमारे बुद्धिमान आपातकालीन प्रबंधन प्लेटफॉर्म के साथ अपने मेहमानों, कर्मचारियों और संपत्ति की रक्षा करें।' },
  'landing.reportEmergency': { en: 'Report Emergency', hi: 'आपातकाल की रिपोर्ट करें' },
  'landing.viewDashboard': { en: 'View Dashboard', hi: 'डैशबोर्ड देखें' },
  'landing.stats.responseTime': { en: 'Avg Response Time', hi: 'औसत प्रतिक्रिया समय' },
  'landing.stats.incidents': { en: 'Incidents Resolved', hi: 'घटनाएं हल' },
  'landing.stats.uptime': { en: 'System Uptime', hi: 'सिस्टम अपटाइम' },
  'landing.stats.properties': { en: 'Properties Protected', hi: 'संरक्षित संपत्तियां' },
  
  // Features
  'features.realtime': { en: 'Real-time Coordination', hi: 'वास्तविक समय समन्वय' },
  'features.realtimeDesc': { en: 'Instant alerts and communication between all stakeholders during emergencies.', hi: 'आपातकाल के दौरान सभी हितधारकों के बीच तत्काल अलर्ट और संचार।' },
  'features.analytics': { en: 'Smart Analytics', hi: 'स्मार्ट विश्लेषण' },
  'features.analyticsDesc': { en: 'Data-driven insights to improve response times and prevent future incidents.', hi: 'प्रतिक्रिया समय में सुधार और भविष्य की घटनाओं को रोकने के लिए डेटा-संचालित अंतर्दृष्टि।' },
  'features.multilingual': { en: 'Multilingual Support', hi: 'बहुभाषी समर्थन' },
  'features.multilingualDesc': { en: 'Communicate effectively with international guests and diverse staff.', hi: 'अंतरराष्ट्रीय मेहमानों और विविध कर्मचारियों के साथ प्रभावी ढंग से संवाद करें।' },
  
  // Dashboard
  'dashboard.title': { en: 'Crisis Dashboard', hi: 'संकट डैशबोर्ड' },
  'dashboard.activeCrises': { en: 'Active Crises', hi: 'सक्रिय संकट' },
  'dashboard.resolved': { en: 'Resolved Today', hi: 'आज हल किया गया' },
  'dashboard.pending': { en: 'Pending Review', hi: 'समीक्षा लंबित' },
  'dashboard.filter': { en: 'Filter', hi: 'फ़िल्टर' },
  'dashboard.search': { en: 'Search incidents...', hi: 'घटनाएं खोजें...' },
  
  // Report
  'report.title': { en: 'Report Emergency', hi: 'आपातकाल की रिपोर्ट करें' },
  'report.selectType': { en: 'Select Emergency Type', hi: 'आपातकाल प्रकार चुनें' },
  'report.fire': { en: 'Fire', hi: 'आग' },
  'report.medical': { en: 'Medical', hi: 'चिकित्सा' },
  'report.security': { en: 'Security', hi: 'सुरक्षा' },
  'report.other': { en: 'Other', hi: 'अन्य' },
  'report.location': { en: 'Location', hi: 'स्थान' },
  'report.locationPlaceholder': { en: 'Enter location (e.g., Room 302, Lobby)', hi: 'स्थान दर्ज करें (जैसे, कमरा 302, लॉबी)' },
  'report.notes': { en: 'Additional Notes (Optional)', hi: 'अतिरिक्त नोट्स (वैकल्पिक)' },
  'report.notesPlaceholder': { en: 'Describe the situation...', hi: 'स्थिति का वर्णन करें...' },
  'report.submit': { en: 'Submit Report', hi: 'रिपोर्ट जमा करें' },
  
  // Communication
  'communication.title': { en: 'Communication Hub', hi: 'संचार केंद्र' },
  'communication.sendMessage': { en: 'Send Message', hi: 'संदेश भेजें' },
  'communication.placeholder': { en: 'Type your message...', hi: 'अपना संदेश टाइप करें...' },
  
  // Analytics
  'analytics.title': { en: 'Analytics Overview', hi: 'विश्लेषण अवलोकन' },
  'analytics.responseTime': { en: 'Response Time Trends', hi: 'प्रतिक्रिया समय रुझान' },
  'analytics.incidentFrequency': { en: 'Incident Frequency', hi: 'घटना आवृत्ति' },
  'analytics.resolution': { en: 'Resolution Stats', hi: 'समाधान आंकड़े' },
  
  // Common
  'common.status.active': { en: 'Active', hi: 'सक्रिय' },
  'common.status.resolved': { en: 'Resolved', hi: 'हल किया गया' },
  'common.status.pending': { en: 'Pending', hi: 'लंबित' },
  'common.darkMode': { en: 'Dark Mode', hi: 'डार्क मोड' },
  'common.lightMode': { en: 'Light Mode', hi: 'लाइट मोड' },
  'common.language': { en: 'Language', hi: 'भाषा' },
  'common.accessibility': { en: 'Accessibility', hi: 'पहुंच' },
  'common.largeText': { en: 'Large Text', hi: 'बड़ा टेक्स्ट' },
  
  // Roles
  'role.guest': { en: 'Guest', hi: 'अतिथि' },
  'role.staff': { en: 'Staff', hi: 'स्टाफ' },
  'role.responder': { en: 'Responder', hi: 'प्रतिक्रियाकर्ता' },
}

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  const t = (key: string): string => {
    const translation = translations[key]
    if (!translation) return key
    return translation[language] || translation.en || key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

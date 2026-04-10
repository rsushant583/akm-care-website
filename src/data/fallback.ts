export const services = [
  { id: "1", title: "Training & Education", description: "Comprehensive industrial training programs including soft skills, technical, behavioral, and commercial training across India.", icon: "GraduationCap", category: "Training" },
  { id: "2", title: "Placement Services", description: "End-to-end job placement and recruitment consultancy connecting talent with the right opportunities.", icon: "Briefcase", category: "HR" },
  { id: "3", title: "Manpower Deployment", description: "Contractual manpower solutions tailored to your operational needs with verified and skilled workforce.", icon: "Users", category: "HR" },
  { id: "4", title: "Industrial Compliance Consulting", description: "Expert guidance on regulatory compliance, policy formation, and industrial standards adherence.", icon: "ShieldCheck", category: "Compliance" },
  { id: "5", title: "Logistics & Freight Services", description: "Reliable freight and logistics solutions through AKM Freight for seamless supply chain management.", icon: "Truck", category: "Logistics" },
  { id: "6", title: "Catering & Facility Management", description: "Professional catering, event management, and guest house management services for organizations.", icon: "ChefHat", category: "Others" },
  { id: "7", title: "Tours & Travel", description: "Corporate travel management, employee transportation, and tours services across India.", icon: "Plane", category: "Others" },
  { id: "8", title: "Maintenance Services", description: "Annual maintenance contracts, repair, civil works, housekeeping, and pest control services.", icon: "Wrench", category: "Others" },
  { id: "9", title: "Client's Need Based Services", description: "Customized solutions designed around your specific industrial and organizational requirements.", icon: "Settings", category: "Others" },
  { id: "10", title: "Employment Verification", description: "Thorough background checks and employment verification services for secure hiring.", icon: "UserCheck", category: "HR" },
  { id: "11", title: "CSR Initiatives", description: "Free soft skill and motivational training programs for communities, schools, and NGOs.", icon: "Heart", category: "Others" },
];

export const products = [
  { id: "1", name: "Makhana (Fox Nuts)", price: 299, quantity: "250g", status: "sold_out" as const, description: "Premium quality fox nuts sourced directly from Bihar's villages." },
  { id: "2", name: "Sattu Powder", price: 199, quantity: "500g", status: "sold_out" as const, description: "Authentic roasted gram flour, a superfood from rural India." },
  { id: "3", name: "Organic Honey", price: 399, quantity: "500ml", status: "sold_out" as const, description: "Pure, unprocessed honey from the forests of central India." },
  { id: "4", name: "Pure Desi Ghee", price: 899, quantity: "1kg", status: "coming_soon" as const, description: "Traditional clarified butter made from pure cow's milk." },
  { id: "5", name: "Roasted Chana", price: 149, quantity: "500g", status: "coming_soon" as const, description: "Crunchy roasted chickpeas, a healthy and delicious snack." },
];

export const motivationQuotes = [
  { id: "1", quote: "Success is not final, failure is not fatal — it is the courage to continue that counts.", source: "Winston Churchill", created_at: new Date().toISOString() },
  { id: "2", quote: "The only way to do great work is to love what you do.", source: "Steve Jobs", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", quote: "In the middle of every difficulty lies opportunity.", source: "Albert Einstein", created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: "4", quote: "It does not matter how slowly you go, as long as you do not stop.", source: "Confucius", created_at: new Date(Date.now() - 259200000).toISOString() },
];

export const faqs = [
  { id: "1", question: "What services does AKM Care provide?", answer: "AKM Care provides a comprehensive range of industrial solutions including corporate training, placement services, manpower deployment, compliance consulting, logistics through AKM Freight, catering & facility management, tours & travel, maintenance services, and customized need-based solutions. We serve industries Pan India.", category: "General" },
  { id: "2", question: "Do you offer training programs across India?", answer: "Yes, we offer training programs Pan India. Our specialized trainers deliver soft skills, technical, behavioral, commercial, leadership, sales & marketing, customer service, and safety & compliance training at your premises or in our training centers.", category: "Training" },
  { id: "3", question: "How can we collaborate with AKM Freight?", answer: "You can reach out to us via our contact form, email at akmcare108@gmail.com, or call us at +91-8200224226. Our logistics team will assess your requirements and provide customized freight solutions.", category: "Logistics" },
  { id: "4", question: "When will products be available for purchase?", answer: "We are currently preparing our e-commerce platform to bring authentic village products directly to your doorstep. Products like Makhana, Sattu, and organic items will be available soon. You can sign up for notifications on our Shop page.", category: "Products" },
  { id: "5", question: "What is AKM Care's CSR initiative?", answer: "AKM Care provides free soft skill, behavioral, and motivational training through our faculty to schools, colleges, NGOs, and community organizations under our CSR program, available on Sundays subject to trainer availability.", category: "General" },
  { id: "6", question: "How do I apply for a job at AKM Care?", answer: "Visit our Careers page and submit your application with your resume. While we may not have open positions at all times, we review every application and keep promising candidates in our talent pool.", category: "General" },
  { id: "7", question: "What industries do you serve?", answer: "We serve manufacturing, IT, pharma, FMCG, construction, hospitality, education, government sectors, and more. Our solutions are customizable for any industry vertical.", category: "Services" },
  { id: "8", question: "Do you provide employment verification services?", answer: "Yes, we offer comprehensive employment verification and background check services for organizations looking to make secure hiring decisions.", category: "Services" },
  { id: "9", question: "What types of training do you specialize in?", answer: "We specialize in soft skills, technical training, behavioral training, commercial training, leadership development, sales & marketing, customer service excellence, and safety & compliance training.", category: "Training" },
  { id: "10", question: "Where is AKM Care located?", answer: "AKM Care is headquartered in Ahmedabad, Gujarat, India. We operate Pan India and serve clients across all major cities and industrial hubs.", category: "General" },
  { id: "11", question: "Can you customize training for our organization?", answer: "Absolutely. We design need-based training modules tailored to your organization's specific challenges, industry requirements, and workforce development goals.", category: "Training" },
  { id: "12", question: "What is the minimum order for logistics services?", answer: "We handle logistics of all scales through AKM Freight. Contact us to discuss your specific requirements and we'll provide a customized solution.", category: "Logistics" },
  { id: "13", question: "Are your products organic and authentic?", answer: "Yes, all our products are sourced directly from rural Indian villages, ensuring authenticity and quality. We prioritize organic and traditional production methods.", category: "Products" },
  { id: "14", question: "Do you offer annual maintenance contracts?", answer: "Yes, we offer comprehensive AMCs covering repair, maintenance, civil works, housekeeping, gardening, and pest control services.", category: "Services" },
  { id: "15", question: "How can I request a CSR training session?", answer: "Training officers, HODs, HR heads, and directors can contact us at akmcare108@gmail.com or call +91-8200224226 to schedule CSR training sessions for nearby communities.", category: "General" },
];

export const trainingCategories = [
  { id: "1", title: "Soft Skills Training", description: "Communication, presentation, team building, time management, interpersonal skills, and professional etiquette training for corporate teams.", icon: "MessageSquare" },
  { id: "2", title: "Technical Training", description: "Industry-specific technical skill development covering manufacturing processes, quality control, and operational excellence.", icon: "Cpu" },
  { id: "3", title: "Behavioral Training", description: "Attitude transformation, emotional intelligence, conflict resolution, and workplace behavior enhancement programs.", icon: "Brain" },
  { id: "4", title: "Commercial Training", description: "Business acumen, financial literacy, negotiation skills, and commercial awareness training for professionals.", icon: "TrendingUp" },
  { id: "5", title: "Leadership Development", description: "Executive coaching, strategic thinking, decision making, and leadership excellence programs for managers and directors.", icon: "Crown" },
  { id: "6", title: "Sales & Marketing Training", description: "Sales techniques, digital marketing, customer acquisition, brand building, and market strategy training.", icon: "Target" },
  { id: "7", title: "Customer Service Excellence", description: "Service orientation, complaint handling, customer delight strategies, and service quality improvement programs.", icon: "Headphones" },
  { id: "8", title: "Safety & Compliance Training", description: "Workplace safety, regulatory compliance, fire safety, first aid, and industrial safety standards training.", icon: "Shield" },
];

export const carouselSlides = [
  { title: "Guided by Timeless Wisdom", subtitle: "Drawing from the sacred teachings of the Bhagavad Gita", gradient: "from-amber-700 to-orange-600" },
  { title: "AKM Care — Your Trusted Partner", subtitle: "Building excellence through ethics and integrity", gradient: "from-orange-600 to-amber-500" },
  { title: "People First, Always", subtitle: "Empowering humanity through skill and knowledge", gradient: "from-amber-600 to-yellow-500" },
  { title: "Industrial Resources", subtitle: "Providing material solutions for every industrial need", gradient: "from-orange-700 to-red-500" },
  { title: "Process Excellence", subtitle: "Systematic methods driving consistent results", gradient: "from-amber-700 to-orange-500" },
  { title: "Technology & Automation", subtitle: "Embracing machines and innovation for the future", gradient: "from-orange-600 to-amber-600" },
  { title: "Sustainability & Environment", subtitle: "Committed to a greener, sustainable tomorrow", gradient: "from-green-700 to-emerald-500" },
];

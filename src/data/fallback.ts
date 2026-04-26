import { thoughts } from "./thoughts";

export const services = [
  { id: "1", title: "Training & Education", description: "Comprehensive industrial training programs including soft skills, technical, behavioral, commercial and Health Safety and Environment related training across India.", icon: "GraduationCap", category: "Training" },
  { id: "2", title: "Placement Services", description: "End-to-end job placement and recruitment consultancy connecting talent with the right opportunities.", icon: "Briefcase", category: "HR" },
  { id: "3", title: "Manpower Deployment", description: "Contractual manpower solutions tailored to your operational needs with verified and skilled workforce.", icon: "Users", category: "HR" },
  { id: "4", title: "Industrial Compliance Consulting", description: "Expert guidance on regulatory compliance, statutory alignment, audits, and industrial standards adherence.", icon: "ShieldCheck", category: "Compliance" },
  { id: "13", title: "Policy Formation", description: "Structured HR, industrial, and corporate policy design—handbooks, SOPs, code of conduct, and governance frameworks tailored to your organization.", icon: "FileText", category: "Compliance" },
  { id: "6", title: "Catering & Facility Management", description: "Professional catering, event management, and guest house management services for organizations.", icon: "ChefHat", category: "Others" },
  { id: "7", title: "Tours & Travel", description: "Corporate travel management, employee transportation, and tours services across India.", icon: "Plane", category: "Others" },
  { id: "8", title: "Maintenance Services", description: "Annual maintenance contracts, repair, civil works, housekeeping, and pest control services.", icon: "Wrench", category: "Others" },
  { id: "9", title: "Client's Need Based Services", description: "Customized solutions designed around your specific industrial and organizational requirements.", icon: "Settings", category: "Others" },
  { id: "10", title: "Employment Verification", description: "Thorough background checks and employment verification services for secure hiring.", icon: "UserCheck", category: "HR" },
  { id: "11", title: "CSR Initiatives", description: "Free soft skill and motivational training programs for communities, schools, and NGOs.", icon: "Heart", category: "Others" },
  { id: "12", title: "IT Solutions", description: "Website creation, mobile app development, and custom software development tailored to your business needs.", icon: "Code", category: "Others" },
];

export const products = [
  { id: "1", name: "Makhana (Fox Nuts)", price: 299, quantity: "250g", stock_quantity: 0, status: "sold_out" as const, image_url: "/products/makhana.png", description: "Premium quality fox nuts sourced directly from Bihar's villages." },
  { id: "2", name: "Sattu Powder", price: 199, quantity: "500g", stock_quantity: 0, status: "sold_out" as const, image_url: "/products/sattu.png", description: "Authentic roasted gram flour, a superfood from rural India." },
  { id: "3", name: "Organic Honey", price: 399, quantity: "500ml", stock_quantity: 0, status: "sold_out" as const, image_url: "/products/honey.png", description: "Pure, unprocessed honey from the forests of central India." },
  { id: "4", name: "Pure Desi Ghee", price: 899, quantity: "1kg", stock_quantity: 0, status: "sold_out" as const, image_url: "/products/ghee.png", description: "Traditional clarified butter made from pure cow's milk." },
  { id: "5", name: "Roasted Chana", price: 149, quantity: "500g", stock_quantity: 0, status: "sold_out" as const, image_url: "/products/roasted-chana.png", description: "Crunchy roasted chickpeas, a healthy and delicious snack." },
];

export const motivationQuotes = thoughts.map((t, idx) => ({
  id: String(idx + 1),
  quote: t.quote,
  source: t.source,
  created_at: new Date(Date.UTC(2026, 0, 1 + idx)).toISOString(),
}));

export const faqs = [
  { id: "1", question: "What services does AKM Care provide?", answer: "AKM Care provides a comprehensive range of industrial solutions including corporate training, placement services, manpower deployment, compliance consulting, IT solutions (websites, apps, software development), catering & facility management, tours & travel, maintenance services, and customized need-based solutions. We serve industries Pan India.", category: "General" },
  { id: "2", question: "Do you offer training programs across India?", answer: "Yes, we offer training programs Pan India. Our specialized trainers deliver soft skills, technical, behavioral, commercial, leadership, sales & marketing, customer service, and safety & compliance training at your premises or in our training centers.", category: "Training" },
  { id: "3", question: "How can we collaborate with AKM Care?", answer: "You can reach out to us via our contact form, email at contact@akmcare.in, or call us at +91-8200224226. Our team will assess your requirements and provide customized solutions.", category: "General" },
  { id: "4", question: "When will products be available for purchase?", answer: "We are currently preparing our e-commerce platform to bring authentic village products directly to your doorstep. Products like Makhana, Sattu, and organic items will be available soon. You can sign up for notifications on our Shop page.", category: "Products" },
  { id: "5", question: "What is AKM Care's CSR initiative?", answer: "AKM Care provides free soft skill, behavioral, and motivational training through our faculty to schools, colleges, NGOs, and community organizations under our CSR program, available on Sundays subject to trainer availability.", category: "General" },
  { id: "6", question: "How do I apply for a job at AKM Care?", answer: "Visit our Careers page and submit your application with your resume. While we may not have open positions at all times, we review every application and keep promising candidates in our talent pool.", category: "General" },
  { id: "7", question: "What industries do you serve?", answer: "We serve manufacturing, IT, pharma, FMCG, construction, hospitality, education, government sectors, and more. Our solutions are customizable for any industry vertical.", category: "Services" },
  { id: "8", question: "Do you provide employment verification services?", answer: "Yes, we offer comprehensive employment verification and background check services for organizations looking to make secure hiring decisions.", category: "Services" },
  { id: "9", question: "What types of training do you specialize in?", answer: "We specialize in soft skills, technical training, behavioral training, commercial training, leadership development, sales & marketing, customer service excellence, and safety & compliance training.", category: "Training" },
  { id: "10", question: "Where is AKM Care located?", answer: "AKM Care is headquartered in Ahmedabad, Gujarat, India. We operate Pan India and serve clients across all major cities and industrial hubs.", category: "General" },
  { id: "11", question: "Can you customize training for our organization?", answer: "Absolutely. We design need-based training modules tailored to your organization's specific challenges, industry requirements, and workforce development goals.", category: "Training" },
  { id: "12", question: "Can AKM Care support custom service requests?", answer: "Yes. Contact us to discuss your specific requirements and we will provide a customized solution.", category: "Services" },
  { id: "13", question: "Are your products organic and authentic?", answer: "Yes, all our products are sourced directly from rural Indian villages, ensuring authenticity and quality. We prioritize organic and traditional production methods.", category: "Products" },
  { id: "14", question: "Do you offer annual maintenance contracts?", answer: "Yes, we offer comprehensive AMCs covering repair, maintenance, civil works, housekeeping, gardening, and pest control services.", category: "Services" },
  { id: "15", question: "How can I request a CSR training session?", answer: "Training officers, HODs, HR heads, and directors can contact us at contact@akmcare.in or call +91-8200224226 to schedule CSR training sessions for nearby communities.", category: "General" },
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

export { carouselSlides } from "./carousel";

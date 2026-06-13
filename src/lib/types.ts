export type ServiceCategory = "training" | "hr" | "compliance" | "other";
export type ProductStatus = "sold_out" | "available";

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory | string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  quantity: string;
  stock_quantity?: number;
  description: string;
  image_url: string;
  status: ProductStatus | string;
  display_order: number;
  created_at: string;
}

export interface OrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  amount: number;
  currency: string;
  quantity: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_status: "created" | "paid" | "failed";
  created_at?: string;
}

export interface MotivationQuote {
  id: string;
  quote: string;
  source: string;
  is_active: boolean;
  created_at: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

export interface FeedbackSubmission {
  id?: string;
  name?: string;
  rating: number;
  message: string;
  page: string;
  is_read?: boolean;
  created_at?: string;
}

export interface ProductInterestSubmission {
  id?: string;
  name?: string;
  email: string;
  product_name: string;
  is_read?: boolean;
  created_at?: string;
}

export interface CareerApplicationSubmission {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

export type VendorApplicationStatus = "pending" | "approved" | "rejected";

export interface VendorDocument {
  name: string;
  path: string;
  size?: number;
  type?: string;
}

export interface VendorApplicationSubmission {
  business_name: string;
  owner_name: string;
  mobile: string;
  email: string;
  gst_number?: string;
  product_category: string;
  business_address: string;
  product_description: string;
  website_links?: string;
  documents?: VendorDocument[];
}

export interface VendorApplication extends VendorApplicationSubmission {
  id: string;
  status: VendorApplicationStatus;
  admin_notes?: string;
  reviewed_at?: string;
  is_read: boolean;
  created_at: string;
}

/** Future marketplace entities — not yet implemented in UI */
export interface VendorAccount {
  id: string;
  application_id?: string;
  business_name: string;
  owner_name: string;
  email: string;
  mobile: string;
  gst_number?: string;
  product_category?: string;
  status: "active" | "suspended" | "inactive";
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

export interface VendorProductListing {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  status: "draft" | "active" | "inactive";
}

export interface VendorOrder {
  id: string;
  vendor_id: string;
  product_id: string;
  amount: number;
  commission_amount: number;
  status: "pending" | "fulfilled" | "cancelled";
}

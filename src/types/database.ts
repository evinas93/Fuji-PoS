// Database types for Fuji POS System
// Simplified types that work with our Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Database Enums
export type UserRole = 'admin' | 'manager' | 'server' | 'cashier' | 'kitchen' | 'viewer'
export type OrderType = 'dine_in' | 'take_out'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'gift_card'
export type ItemCategory = 
  | 'red_wine' | 'white_wine' | 'blush_wine' | 'plum_wine'
  | 'domestic_beer' | 'imported_beer' | 'sake' | 'beverages'
  | 'sushi_rolls' | 'tempura_appetizer' | 'lunch_specials'
  | 'early_bird' | 'dinner' | 'side_orders' | 'children_menu'

// Simplified Database Interface - focusing on what we actually use
export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
    Views: Record<string, any>
    Functions: Record<string, any>
    Enums: Record<string, any>
  }
}

// Core entity types based on our actual schema
export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  pin_code: string | null
  hourly_rate: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  name: string
  category_type: ItemCategory
  display_order: number
  icon: string | null
  color: string | null
  is_active: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  category_id: string
  sku: string | null
  name: string
  description: string | null
  base_price: number
  glass_price: number | null
  bottle_price: number | null
  lunch_price: number | null
  dinner_price: number | null
  cost: number | null
  tax_exempt: boolean
  preparation_time: number
  calories: number | null
  spicy_level: number | null
  is_raw: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  allergens: Json
  image_url: string | null
  display_order: number | null
  is_available: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface Modifier {
  id: string
  name: string
  price: number
  modifier_group: string | null
  is_active: boolean
  created_at: string
}

export interface ItemModifier {
  item_id: string
  modifier_id: string
  is_required: boolean
  is_default: boolean
}

export interface RestaurantTable {
  id: string
  table_number: number
  section: string | null
  seats: number
  is_active: boolean
  is_occupied: boolean
  current_order_id: string | null
  occupied_at: string | null
  server_id: string | null
}

export interface Order {
  id: string
  order_number: number
  order_date: string
  order_type: OrderType
  status: OrderStatus
  table_id: string | null
  customer_name: string | null
  customer_phone: string | null
  server_id: string | null
  cashier_id: string | null
  subtotal: number
  discount_amount: number
  discount_reason: string | null
  tax_rate: number
  tax_amount: number
  gratuity_rate: number | null
  gratuity_amount: number
  service_charge_rate: number
  service_charge: number
  total_amount: number
  amount_paid: number
  change_amount: number
  notes: string | null
  is_void: boolean
  void_reason: string | null
  void_by: string | null
  created_at: string
  confirmed_at: string | null
  completed_at: string | null
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  item_id: string | null
  item_name: string
  quantity: number
  unit_price: number
  modifiers: Json
  special_instructions: string | null
  discount_amount: number
  tax_amount: number
  total_price: number
  status: OrderStatus
  sent_to_kitchen_at: string | null
  prepared_at: string | null
  served_at: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  order_id: string
  payment_method: PaymentMethod
  amount: number
  tip_amount: number
  card_last_four: string | null
  transaction_id: string | null
  processor_response: Json | null
  processed_by: string | null
  is_void: boolean
  void_reason: string | null
  created_at: string
}

export interface DailySales {
  id: string
  sales_date: string
  day_of_week: string
  opening_time: string | null
  closing_time: string | null
  total_orders: number
  dine_in_orders: number
  take_out_orders: number
  cancelled_orders: number
  gross_sales: number
  net_sales: number
  dine_in_sales: number
  take_out_sales: number
  food_sales: number
  beverage_sales: number
  lunch_sales: number
  dinner_sales: number
  total_discounts: number
  total_tax: number
  total_gratuity: number
  total_service_charges: number
  cash_sales: number
  credit_sales: number
  cash_tips: number
  credit_tips: number
  cash_deposited: number
  credit_deposited: number
  is_closed: boolean
  close_reason: string | null
  created_at: string
  updated_at: string
}

export interface Shift {
  id: string
  user_id: string
  shift_date: string
  clock_in: string
  clock_out: string | null
  break_start: string | null
  break_end: string | null
  total_sales: number
  total_tips: number
  cash_tips: number
  credit_tips: number
  tip_out: number
  created_at: string
}

export interface InventoryItem {
  id: string
  name: string
  unit: string
  current_quantity: number
  reorder_point: number | null
  last_restocked: string | null
  updated_at: string
}

export interface InventoryAdjustment {
  id: string
  inventory_item_id: string
  adjustment_type: string
  quantity_change: number
  reason: string | null
  reference_order_id: string | null
  adjusted_by: string
  created_at: string
}

export interface SystemSetting {
  key: string
  value: string
  description: string | null
  updated_by: string | null
  updated_at: string
}

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: string
  old_values: Json | null
  new_values: Json | null
  changed_by: string | null
  changed_at: string
  ip_address: string | null
  user_agent: string | null
}

// Insert types (for creating new records)
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type MenuItemInsert = Omit<MenuItem, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type OrderInsert = Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'> & {
  id?: string
  order_number?: number
  created_at?: string
  updated_at?: string
}

export type OrderItemInsert = Omit<OrderItem, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type PaymentInsert = Omit<Payment, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

// Extended types with relationships
export interface MenuItemWithCategory extends MenuItem {
  menu_categories?: MenuCategory
  modifiers?: ModifierWithGroup[]
}

export interface OrderWithDetails extends Order {
  order_items?: OrderItemWithMenuItem[]
  users?: User
  restaurant_tables?: RestaurantTable
  payments?: Payment[]
}

export interface OrderItemWithMenuItem extends OrderItem {
  menu_items?: MenuItem
}

export interface ModifierWithGroup extends Modifier {
  is_required?: boolean
  is_default?: boolean
}

// Dashboard and analytics types
export interface DashboardStats {
  date: string
  total_orders: number
  active_orders: number
  completed_orders: number
  total_sales: number
  average_ticket: number
  top_items: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  hourly_sales: Array<{
    hour: number
    orders: number
    sales: number
  }>
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// Form types for creating/updating records
export interface CreateOrderForm {
  order_type: OrderType
  table_id?: string
  customer_name?: string
  customer_phone?: string
  notes?: string
  items: Array<{
    item_id: string
    quantity: number
    modifiers: Array<{
      id: string
      name: string
      price: number
    }>
    special_instructions?: string
  }>
}

export interface ProcessPaymentForm {
  order_id: string
  payment_method: PaymentMethod
  amount: number
  tip_amount?: number
  cash_received?: number
  transaction_id?: string
  card_last_four?: string
}

// Kitchen display types
export interface KitchenOrder {
  id: string
  order_number: number
  table_number: number | null
  order_type: OrderType
  items: Array<{
    id: string
    item_name: string
    quantity: number
    modifiers: Json
    special_instructions: string | null
    status: OrderStatus
    preparation_time: number
  }>
  created_at: string
  estimated_ready_time?: string
}
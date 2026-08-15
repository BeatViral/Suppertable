export type Role = 'customer' | 'kitchen_founder' | 'admin' | 'driver'
export type ApplicationStatus = 'submitted' | 'under_review' | 'more_information_required' | 'approved' | 'declined'
export interface Profile { id: string; full_name: string | null; role: Role }
export interface Application { id: string; applicant_id: string; full_name: string; email: string; mobile: string; suburb: string; food: string; signature_dishes: string; cooking_from: string; proposed_name: string | null; previously_sold_food: boolean; why_launch: string; status: ApplicationStatus; admin_note: string | null; created_at: string }
export interface PlatformSettings { signature_meal_price_cents: number; platform_fee_bps: number; pickup_fee_cents: number; free_delivery_enabled: boolean; delivery_fee_cents: number }

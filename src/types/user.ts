export interface UserManagementProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'customer' | 'admin';
  is_blocked: boolean;
  blocked_reason?: string;
  blocked_at?: string;
  created_at: string;
  updated_at?: string;
  total_orders?: number;
  total_spent?: number;
}


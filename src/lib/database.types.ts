export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone_number: string | null
          date_of_birth: string | null
          postal_code: string | null
          prefecture: string | null
          city: string | null
          address_line: string | null
          building: string | null
          role: 'Admin' | 'Staff' | 'Partners' | 'Members'
          rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          postal_code?: string | null
          prefecture?: string | null
          city?: string | null
          address_line?: string | null
          building?: string | null
          role?: 'Admin' | 'Staff' | 'Partners' | 'Members'
          rank?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          postal_code?: string | null
          prefecture?: string | null
          city?: string | null
          address_line?: string | null
          building?: string | null
          role?: 'Admin' | 'Staff' | 'Partners' | 'Members'
          rank?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          name: string
          type: string | null
          manufacturer: string | null
          year: number | null
          price: number | null
          description: string | null
          specs: Json
          features: Json
          images: Json
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: string | null
          manufacturer?: string | null
          year?: number | null
          price?: number | null
          description?: string | null
          specs?: Json
          features?: Json
          images?: Json
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string | null
          manufacturer?: string | null
          year?: number | null
          price?: number | null
          description?: string | null
          specs?: Json
          features?: Json
          images?: Json
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rental_vehicles: {
        Row: {
          id: string
          vehicle_id: string | null
          location: string | null
          price_per_day: number
          available_dates: Json
          unavailable_dates: Json
          maintenance_dates: Json
          status: 'Available' | 'OnRent' | 'Returned' | 'Maintenance'
          options: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          location?: string | null
          price_per_day: number
          available_dates?: Json
          unavailable_dates?: Json
          maintenance_dates?: Json
          status?: 'Available' | 'OnRent' | 'Returned' | 'Maintenance'
          options?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          location?: string | null
          price_per_day?: number
          available_dates?: Json
          unavailable_dates?: Json
          maintenance_dates?: Json
          status?: 'Available' | 'OnRent' | 'Returned' | 'Maintenance'
          options?: Json
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string | null
          rental_vehicle_id: string | null
          start_date: string
          end_date: string
          days: number
          status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'
          subtotal: number
          tax: number
          total: number
          options: Json
          payment_method: string | null
          payment_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          rental_vehicle_id?: string | null
          start_date: string
          end_date: string
          days: number
          status?: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'
          subtotal: number
          tax?: number
          total: number
          options?: Json
          payment_method?: string | null
          payment_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          rental_vehicle_id?: string | null
          start_date?: string
          end_date?: string
          days?: number
          status?: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'
          subtotal?: number
          tax?: number
          total?: number
          options?: Json
          payment_method?: string | null
          payment_status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          author_id: string | null
          title: string
          content: string
          excerpt: string | null
          cover_image: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          tags: Json
          status: 'Draft' | 'Published' | 'Archived'
          likes: number
          views: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id?: string | null
          title: string
          content: string
          excerpt?: string | null
          cover_image?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          tags?: Json
          status?: 'Draft' | 'Published' | 'Archived'
          likes?: number
          views?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string | null
          title?: string
          content?: string
          excerpt?: string | null
          cover_image?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          tags?: Json
          status?: 'Draft' | 'Published' | 'Archived'
          likes?: number
          views?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      story_likes: {
        Row: {
          id: string
          story_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          story_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string | null
          user_id?: string | null
          created_at?: string
        }
      }
      story_questions: {
        Row: {
          id: string
          story_id: string | null
          user_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id?: string | null
          user_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string | null
          user_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      story_answers: {
        Row: {
          id: string
          question_id: string | null
          user_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id?: string | null
          user_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_id?: string | null
          user_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          name: string
          type: 'RVPark' | 'Restaurant' | 'GasStation' | 'Tourist' | 'Other' | null
          description: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
          contact: Json
          images: Json
          facilities: Json
          pricing: Json
          rating: number
          review_count: number
          opening_hours: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: 'RVPark' | 'Restaurant' | 'GasStation' | 'Tourist' | 'Other' | null
          description?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          contact?: Json
          images?: Json
          facilities?: Json
          pricing?: Json
          rating?: number
          review_count?: number
          opening_hours?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'RVPark' | 'Restaurant' | 'GasStation' | 'Tourist' | 'Other' | null
          description?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          contact?: Json
          images?: Json
          facilities?: Json
          pricing?: Json
          rating?: number
          review_count?: number
          opening_hours?: Json
          created_at?: string
          updated_at?: string
        }
      }
      partner_favorites: {
        Row: {
          id: string
          user_id: string | null
          partner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          partner_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          partner_id?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          target_type: 'Vehicle' | 'RentalVehicle' | 'Partner' | 'Activity'
          target_id: string
          author_id: string | null
          rating: number
          title: string | null
          content: string
          pros: Json
          cons: Json
          images: Json
          helpful: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          target_type: 'Vehicle' | 'RentalVehicle' | 'Partner' | 'Activity'
          target_id: string
          author_id?: string | null
          rating: number
          title?: string | null
          content: string
          pros?: Json
          cons?: Json
          images?: Json
          helpful?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          target_type?: 'Vehicle' | 'RentalVehicle' | 'Partner' | 'Activity'
          target_id?: string
          author_id?: string | null
          rating?: number
          title?: string | null
          content?: string
          pros?: Json
          cons?: Json
          images?: Json
          helpful?: number
          created_at?: string
          updated_at?: string
        }
      }
      review_helpfuls: {
        Row: {
          id: string
          review_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          review_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string | null
          user_id?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string
          message: string
          read_at: string | null
          story_id: string | null
          question_id: string | null
          answer_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: string
          message: string
          read_at?: string | null
          story_id?: string | null
          question_id?: string | null
          answer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string
          message?: string
          read_at?: string | null
          story_id?: string | null
          question_id?: string | null
          answer_id?: string | null
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number | null
          price_type: string | null
          duration: string | null
          location: string | null
          provider: string | null
          start_date: string | null
          end_date: string | null
          min_participants: number | null
          max_participants: number | null
          images: Json
          tags: Json
          included: Json
          requirements: Json
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price?: number | null
          price_type?: string | null
          duration?: string | null
          location?: string | null
          provider?: string | null
          start_date?: string | null
          end_date?: string | null
          min_participants?: number | null
          max_participants?: number | null
          images?: Json
          tags?: Json
          included?: Json
          requirements?: Json
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number | null
          price_type?: string | null
          duration?: string | null
          location?: string | null
          provider?: string | null
          start_date?: string | null
          end_date?: string | null
          min_participants?: number | null
          max_participants?: number | null
          images?: Json
          tags?: Json
          included?: Json
          requirements?: Json
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

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
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          type: 'Info' | 'Warning' | 'Alert'
          priority: 'Low' | 'Medium' | 'High'
          published: boolean
          category: string | null
          published_at: string | null
          author_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          type?: 'Info' | 'Warning' | 'Alert'
          priority?: 'Low' | 'Medium' | 'High'
          published?: boolean
          category?: string | null
          published_at?: string | null
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: 'Info' | 'Warning' | 'Alert'
          priority?: 'Low' | 'Medium' | 'High'
          published?: boolean
          category?: string | null
          published_at?: string | null
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          type: string | null
          parent_id: string | null
          order: number
          is_system: boolean
          label_ja: string | null
          key: string | null
          label_en: string | null
          display_order: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type?: string | null
          parent_id?: string | null
          order?: number
          is_system?: boolean
          label_ja?: string | null
          key?: string | null
          label_en?: string | null
          display_order?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: string | null
          parent_id?: string | null
          order?: number
          is_system?: boolean
          label_ja?: string | null
          key?: string | null
          label_en?: string | null
          display_order?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          category: string | null
          phone_number: string | null
          admin_notes: string | null
          status: 'New' | 'InProgress' | 'Resolved' | 'Closed'
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject: string
          message: string
          category?: string | null
          phone_number?: string | null
          admin_notes?: string | null
          status?: 'New' | 'InProgress' | 'Resolved' | 'Closed'
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string
          message?: string
          category?: string | null
          phone_number?: string | null
          admin_notes?: string | null
          status?: 'New' | 'InProgress' | 'Resolved' | 'Closed'
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
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
          bio: string | null
          email_notifications: boolean
          story_notifications: boolean
          rental_notifications: boolean
          comment_notifications: boolean
          profile_visibility: 'Public' | 'Private' | 'Friends'
          show_email: boolean
          show_phone: boolean
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
          bio?: string | null
          email_notifications?: boolean
          story_notifications?: boolean
          rental_notifications?: boolean
          comment_notifications?: boolean
          profile_visibility?: 'Public' | 'Private' | 'Friends'
          show_email?: boolean
          show_phone?: boolean
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
      sale_vehicles: {
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
          purpose: string | null
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
          purpose?: string | null
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
          purpose?: string | null
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
          images: string[] | null
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
          is_published: boolean
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
          is_published?: boolean
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
          is_published?: boolean
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
          status: string
          views: number | null
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
          status?: string
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
      events: {
        Row: {
          id: string
          title: string
          description: string
          event_date: string
          end_date: string | null
          location: string | null
          location_type: string
          max_participants: number | null
          image_url: string | null
          status: string
          organizer_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          event_date: string
          end_date?: string | null
          location?: string | null
          location_type: string
          max_participants?: number | null
          image_url?: string | null
          status: string
          organizer_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          event_date?: string
          end_date?: string | null
          location?: string | null
          location_type?: string
          max_participants?: number | null
          image_url?: string | null
          status?: string
          organizer_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      equipment: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          quantity: number
          price_per_day: number
          status: string
          available_quantity: number
          images: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          quantity: number
          price_per_day: number
          status: string
          available_quantity?: number
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          quantity?: number
          price_per_day?: number
          status?: string
          available_quantity?: number
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          category: string | null
          status: string
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          category?: string | null
          status?: string
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          category?: string | null
          status?: string
          views?: number
          created_at?: string
          updated_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          question_id: string
          user_id: string
          content: string
          is_accepted: boolean
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id: string
          user_id: string
          content: string
          is_accepted?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          user_id?: string
          content?: string
          is_accepted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      routes: {
        Row: {
          id: string
          user_id: string
          name: string
          origin: string
          destination: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          origin: string
          destination: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          origin?: string
          destination?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      route_stops: {
        Row: {
          id: string
          route_id: string
          stop_order: number
          name: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          route_id: string
          stop_order: number
          name?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          stop_order?: number
          name?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rental_checklists: {
        Row: {
          id: string
          reservation_id: string
          checklist_type: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          checklist_type: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          checklist_type?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      equipment_preparations: {
        Row: {
          id: string
          reservation_id: string
          equipment_id: string
          equipment_name: string
          quantity: number
          prepared: boolean
          prepared_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          equipment_id: string
          equipment_name: string
          quantity: number
          prepared?: boolean
          prepared_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          equipment_id?: string
          equipment_name?: string
          quantity?: number
          prepared?: boolean
          prepared_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

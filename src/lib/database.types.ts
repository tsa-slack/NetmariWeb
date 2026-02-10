export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          description: string | null
          duration: string | null
          end_date: string | null
          id: string
          images: Json | null
          included: Json | null
          location: string | null
          max_participants: number | null
          min_participants: number | null
          name: string
          price: number | null
          price_type: string | null
          provider: string | null
          requirements: Json | null
          start_date: string | null
          status: string | null
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: string | null
          end_date?: string | null
          id?: string
          images?: Json | null
          included?: Json | null
          location?: string | null
          max_participants?: number | null
          min_participants?: number | null
          name: string
          price?: number | null
          price_type?: string | null
          provider?: string | null
          requirements?: Json | null
          start_date?: string | null
          status?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: string | null
          end_date?: string | null
          id?: string
          images?: Json | null
          included?: Json | null
          location?: string | null
          max_participants?: number | null
          min_participants?: number | null
          name?: string
          price?: number | null
          price_type?: string | null
          provider?: string | null
          requirements?: Json | null
          start_date?: string | null
          status?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string | null
          id: string
          priority: string | null
          published: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          priority?: string | null
          published?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          priority?: string | null
          published?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          is_accepted: boolean | null
          question_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_accepted?: boolean | null
          question_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_accepted?: boolean | null
          question_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          key: string
          label_en: string | null
          label_ja: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          key: string
          label_en?: string | null
          label_ja: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          key?: string
          label_en?: string | null
          label_ja?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          category: string | null
          category_id: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string | null
          name: string | null
          phone_number: string | null
          priority: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone_number?: string | null
          priority?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone_number?: string | null
          priority?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          available_quantity: number | null
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          name: string
          price_per_day: number
          pricing_type: string | null
          quantity: number | null
          specs: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          available_quantity?: number | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          name: string
          price_per_day: number
          pricing_type?: string | null
          quantity?: number | null
          specs?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          available_quantity?: number | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          name?: string
          price_per_day?: number
          pricing_type?: string | null
          quantity?: number | null
          specs?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_preparations: {
        Row: {
          created_at: string | null
          equipment_id: string | null
          equipment_name: string | null
          id: string
          prepared: boolean | null
          prepared_at: string | null
          prepared_by: string | null
          quantity: number | null
          reservation_id: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_id?: string | null
          equipment_name?: string | null
          id?: string
          prepared?: boolean | null
          prepared_at?: string | null
          prepared_by?: string | null
          quantity?: number | null
          reservation_id?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_id?: string | null
          equipment_name?: string | null
          id?: string
          prepared?: boolean | null
          prepared_at?: string | null
          prepared_by?: string | null
          quantity?: number | null
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_preparations_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_preparations_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          location: string | null
          location_type: string | null
          max_participants: number | null
          organizer_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          location?: string | null
          location_type?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          location?: string | null
          location_type?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          answer_id: string | null
          created_at: string | null
          id: string
          message: string
          question_id: string | null
          read_at: string | null
          story_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          answer_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          question_id?: string | null
          read_at?: string | null
          story_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          answer_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          question_id?: string | null
          read_at?: string | null
          story_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_favorites: {
        Row: {
          created_at: string | null
          id: string
          partner_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          partner_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          partner_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_favorites_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          category_id: string | null
          contact: Json | null
          created_at: string | null
          description: string | null
          facilities: Json | null
          id: string
          images: Json | null
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          pricing: Json | null
          rating: number | null
          review_count: number | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          contact?: Json | null
          created_at?: string | null
          description?: string | null
          facilities?: Json | null
          id?: string
          images?: Json | null
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          pricing?: Json | null
          rating?: number | null
          review_count?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string | null
          contact?: Json | null
          created_at?: string | null
          description?: string | null
          facilities?: Json | null
          id?: string
          images?: Json | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          pricing?: Json | null
          rating?: number | null
          review_count?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_checklists: {
        Row: {
          checklist_data: Json | null
          checklist_type: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          reservation_id: string | null
          updated_at: string | null
        }
        Insert: {
          checklist_data?: Json | null
          checklist_type?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reservation_id?: string | null
          updated_at?: string | null
        }
        Update: {
          checklist_data?: Json | null
          checklist_type?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reservation_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_checklists_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_checklists_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_vehicles: {
        Row: {
          available_dates: Json | null
          created_at: string | null
          id: string
          license_plate: string | null
          location: string | null
          maintenance_dates: Json | null
          options: Json | null
          price_per_day: number
          status: string | null
          unavailable_dates: Json | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          available_dates?: Json | null
          created_at?: string | null
          id?: string
          license_plate?: string | null
          location?: string | null
          maintenance_dates?: Json | null
          options?: Json | null
          price_per_day: number
          status?: string | null
          unavailable_dates?: Json | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          available_dates?: Json | null
          created_at?: string | null
          id?: string
          license_plate?: string | null
          location?: string | null
          maintenance_dates?: Json | null
          options?: Json | null
          price_per_day?: number
          status?: string | null
          unavailable_dates?: Json | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_activities: {
        Row: {
          activity_id: string | null
          created_at: string | null
          date: string
          id: string
          participants: number
          price: number
          reservation_id: string | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          participants?: number
          price: number
          reservation_id?: string | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          participants?: number
          price?: number
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_activities_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_equipment: {
        Row: {
          created_at: string | null
          days: number
          equipment_id: string | null
          id: string
          price_per_day: number
          quantity: number
          reservation_id: string | null
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          days: number
          equipment_id?: string | null
          id?: string
          price_per_day: number
          quantity?: number
          reservation_id?: string | null
          subtotal: number
        }
        Update: {
          created_at?: string | null
          days?: number
          equipment_id?: string | null
          id?: string
          price_per_day?: number
          quantity?: number
          reservation_id?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservation_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_equipment_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string | null
          days: number
          end_date: string
          id: string
          options: Json | null
          payment_method: string | null
          payment_status: string | null
          rental_vehicle_id: string | null
          start_date: string
          status: string | null
          subtotal: number
          tax: number
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          days: number
          end_date: string
          id?: string
          options?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          rental_vehicle_id?: string | null
          start_date: string
          status?: string | null
          subtotal: number
          tax: number
          total: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          days?: number
          end_date?: string
          id?: string
          options?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          rental_vehicle_id?: string | null
          start_date?: string
          status?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_rental_vehicle_id_fkey"
            columns: ["rental_vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpfuls: {
        Row: {
          created_at: string | null
          id: string
          review_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_helpfuls_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpfuls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string | null
          cons: Json | null
          content: string | null
          created_at: string | null
          id: string
          images: Json | null
          is_published: boolean | null
          pros: Json | null
          rating: number | null
          reservation_id: string | null
          target_id: string
          target_type: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          cons?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          images?: Json | null
          is_published?: boolean | null
          pros?: Json | null
          rating?: number | null
          reservation_id?: string | null
          target_id: string
          target_type: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          cons?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          images?: Json | null
          is_published?: boolean | null
          pros?: Json | null
          rating?: number | null
          reservation_id?: string | null
          target_id?: string
          target_type?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          address: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string | null
          notes: string | null
          partner_id: string | null
          route_id: string | null
          stop_order: number
        }
        Insert: {
          address?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          notes?: string | null
          partner_id?: string | null
          route_id?: string | null
          stop_order: number
        }
        Update: {
          address?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          notes?: string | null
          partner_id?: string | null
          route_id?: string | null
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string | null
          description: string | null
          dest_lat: number | null
          dest_lng: number | null
          destination: string | null
          id: string
          is_public: boolean | null
          name: string
          origin: string | null
          origin_lat: number | null
          origin_lng: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          destination?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          origin?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          destination?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          origin?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          author_id: string | null
          content: string
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          images: Json | null
          latitude: number | null
          likes: number | null
          location: string | null
          longitude: number | null
          status: string | null
          tags: Json | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          content: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          images?: Json | null
          latitude?: number | null
          likes?: number | null
          location?: string | null
          longitude?: number | null
          status?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          images?: Json | null
          latitude?: number | null
          likes?: number | null
          location?: string | null
          longitude?: number | null
          status?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      story_answers: {
        Row: {
          content: string
          created_at: string | null
          id: string
          question_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          question_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          question_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "story_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      story_favorites: {
        Row: {
          created_at: string | null
          id: string
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_favorites_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      story_likes: {
        Row: {
          created_at: string | null
          id: string
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      story_questions: {
        Row: {
          content: string
          created_at: string | null
          id: string
          story_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          story_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          story_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_questions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          rank_settings: Json | null
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          rank_settings?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          rank_settings?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: string | null
          address_line: string | null
          building: string | null
          city: string | null
          comment_notifications: boolean | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          email_notifications: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          postal_code: string | null
          prefecture: string | null
          profile_visibility: string | null
          rank: string
          rental_notifications: boolean | null
          role: string
          show_email: boolean | null
          show_phone: boolean | null
          story_notifications: boolean | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string | null
        }
        Insert: {
          account_status?: string | null
          address_line?: string | null
          building?: string | null
          city?: string | null
          comment_notifications?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          postal_code?: string | null
          prefecture?: string | null
          profile_visibility?: string | null
          rank?: string
          rental_notifications?: boolean | null
          role?: string
          show_email?: boolean | null
          show_phone?: boolean | null
          story_notifications?: boolean | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          account_status?: string | null
          address_line?: string | null
          building?: string | null
          city?: string | null
          comment_notifications?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          postal_code?: string | null
          prefecture?: string | null
          profile_visibility?: string | null
          rank?: string
          rental_notifications?: boolean | null
          role?: string
          show_email?: boolean | null
          show_phone?: boolean | null
          story_notifications?: boolean | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_favorites: {
        Row: {
          created_at: string | null
          id: string
          rental_vehicle_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rental_vehicle_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rental_vehicle_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_favorites_rental_vehicle_id_fkey"
            columns: ["rental_vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          images: Json | null
          manufacturer: string | null
          name: string
          price: number | null
          purpose: string
          specs: Json | null
          status: string | null
          type: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          images?: Json | null
          manufacturer?: string | null
          name: string
          price?: number | null
          purpose?: string
          specs?: Json | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          images?: Json | null
          manufacturer?: string | null
          name?: string
          price?: number | null
          purpose?: string
          specs?: Json | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_total_likes: { Args: { user_uuid: string }; Returns: number }
      calculate_total_posts: { Args: { user_uuid: string }; Returns: number }
      calculate_total_spent: { Args: { user_uuid: string }; Returns: number }
      check_user_role: { Args: { allowed_roles: string[] }; Returns: boolean }
      determine_user_rank: { Args: { user_uuid: string }; Returns: string }
      update_user_rank: { Args: { user_uuid: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

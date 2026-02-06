-- Fix handle_new_user function to include all registration fields

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    phone_number,
    postal_code,
    prefecture,
    city,
    address_line,
    building,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'postal_code',
    NEW.raw_user_meta_data->>'prefecture',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'address_line',
    NEW.raw_user_meta_data->>'building',
    'Members'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

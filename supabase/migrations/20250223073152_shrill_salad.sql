/*
  # Add Events Table

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `date` (text)
      - `time` (text)
      - `price` (text, nullable)
      - `image_url` (text)
      - `booking_type` (text, enum: class, event, reservation)
      - `booking_url` (text, nullable)
      - `active` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `events` table
    - Add policies for:
      - Public read access to active events
      - Authenticated users can manage events
*/

-- Create enum type for booking types
CREATE TYPE booking_type AS ENUM ('class', 'event', 'reservation');

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  price text,
  image_url text NOT NULL,
  booking_type booking_type,
  booking_url text,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Events are viewable by everyone"
  ON events
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage events"
  ON events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample events
INSERT INTO events (title, description, date, time, price, image_url, booking_type, booking_url, display_order) VALUES
(
  'Tiki Tuesday',
  'Join us every Tuesday for special tiki drinks and island vibes. Live music from local artists.',
  'Every Tuesday',
  '6 PM - 10 PM',
  NULL,
  'https://images.unsplash.com/photo-1613476798408-6c9c2f828b6e?auto=format&fit=crop&q=80&w=800',
  'event',
  'https://calendly.com/spoonbill/tiki-tuesday',
  1
),
(
  'Sunset Social Hour',
  'Half-price appetizers and specialty cocktails while watching the beautiful Redondo Beach sunset.',
  'Daily',
  '3 PM - 5 PM',
  NULL,
  'https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800',
  'reservation',
  'https://resy.com/spoonbill',
  2
),
(
  'Saturday Mixology Classes',
  'Learn the art of craft cocktails from our expert mixologists. Includes hands-on instruction, tastings, and a take-home tiki glass.',
  'Every Saturday',
  '11 AM - 1 PM & 3 PM - 5 PM',
  '$95 per person',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
  'class',
  'https://calendly.com/spoonbill/mixology-class',
  3
),
(
  'Jazz & Cocktails',
  'Live jazz performances paired with our master mixologist''s special creations.',
  'Every Friday & Saturday',
  '7 PM - 11 PM',
  NULL,
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
  'reservation',
  'https://resy.com/spoonbill',
  4
);
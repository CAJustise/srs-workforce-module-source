-- Create enum types if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'table_status') THEN
    CREATE TYPE table_status AS ENUM ('available', 'reserved', 'occupied', 'maintenance');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
    CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_booking_status') THEN
    CREATE TYPE event_booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
  END IF;
END $$;

-- Create tables table
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  status table_status NOT NULL DEFAULT 'available',
  section text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create time slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time time NOT NULL,
  end_time time NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  capacity integer NOT NULL CHECK (capacity > 0),
  is_event_slot boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables(id),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  party_size integer NOT NULL CHECK (party_size > 0),
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  special_requests text,
  status reservation_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event bookings table
CREATE TABLE IF NOT EXISTS event_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  company_name text,
  guest_count integer NOT NULL CHECK (guest_count > 0),
  event_date date NOT NULL,
  event_time time NOT NULL,
  duration_hours numeric(4,2) NOT NULL CHECK (duration_hours > 0),
  budget_range text,
  catering_needed boolean DEFAULT false,
  bar_service_needed boolean DEFAULT false,
  av_equipment_needed boolean DEFAULT false,
  setup_requirements text,
  special_requests text,
  status event_booking_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blackout dates table
CREATE TABLE IF NOT EXISTS blackout_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  reason text NOT NULL,
  affects_reservations boolean DEFAULT true,
  affects_events boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_blackout_date UNIQUE (date)
);

-- Enable RLS
DO $$ 
BEGIN
  ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
  ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
  ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE blackout_dates ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tables_status') THEN
    CREATE INDEX idx_tables_status ON tables(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_time_slots_day_of_week') THEN
    CREATE INDEX idx_time_slots_day_of_week ON time_slots(day_of_week);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reservations_date') THEN
    CREATE INDEX idx_reservations_date ON reservations(reservation_date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reservations_status') THEN
    CREATE INDEX idx_reservations_status ON reservations(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_bookings_date') THEN
    CREATE INDEX idx_event_bookings_date ON event_bookings(event_date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_bookings_status') THEN
    CREATE INDEX idx_event_bookings_status ON event_bookings(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_blackout_dates_date') THEN
    CREATE INDEX idx_blackout_dates_date ON blackout_dates(date);
  END IF;
END $$;

-- Create policies for tables
DROP POLICY IF EXISTS "Anyone can view available tables" ON tables;
DROP POLICY IF EXISTS "Authenticated users can manage tables" ON tables;

CREATE POLICY "Anyone can view available tables"
  ON tables
  FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage tables"
  ON tables
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for time slots
DROP POLICY IF EXISTS "Anyone can view active time slots" ON time_slots;
DROP POLICY IF EXISTS "Authenticated users can manage time slots" ON time_slots;

CREATE POLICY "Anyone can view active time slots"
  ON time_slots
  FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage time slots"
  ON time_slots
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for reservations
DROP POLICY IF EXISTS "Anyone can view and create reservations" ON reservations;
DROP POLICY IF EXISTS "Anyone can insert reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can manage all reservations" ON reservations;

CREATE POLICY "Anyone can view and create reservations"
  ON reservations
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert reservations"
  ON reservations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage all reservations"
  ON reservations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for event bookings
DROP POLICY IF EXISTS "Anyone can view and create event bookings" ON event_bookings;
DROP POLICY IF EXISTS "Anyone can insert event bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can manage all event bookings" ON event_bookings;

CREATE POLICY "Anyone can view and create event bookings"
  ON event_bookings
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert event bookings"
  ON event_bookings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage all event bookings"
  ON event_bookings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for blackout dates
DROP POLICY IF EXISTS "Anyone can view blackout dates" ON blackout_dates;
DROP POLICY IF EXISTS "Authenticated users can manage blackout dates" ON blackout_dates;

CREATE POLICY "Anyone can view blackout dates"
  ON blackout_dates
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage blackout dates"
  ON blackout_dates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_tables_updated_at ON tables;
DROP TRIGGER IF EXISTS update_time_slots_updated_at ON time_slots;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
DROP TRIGGER IF EXISTS update_event_bookings_updated_at ON event_bookings;
DROP TRIGGER IF EXISTS update_blackout_dates_updated_at ON blackout_dates;

CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at
  BEFORE UPDATE ON time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_bookings_updated_at
  BEFORE UPDATE ON event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blackout_dates_updated_at
  BEFORE UPDATE ON blackout_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to check table availability
CREATE OR REPLACE FUNCTION check_table_availability(
  p_table_id uuid,
  p_date date,
  p_time time,
  p_duration interval DEFAULT interval '2 hours'
)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM reservations
    WHERE table_id = p_table_id
    AND reservation_date = p_date
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      reservation_time BETWEEN p_time AND p_time + p_duration
      OR p_time BETWEEN reservation_time AND reservation_time + interval '2 hours'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to check event slot availability
CREATE OR REPLACE FUNCTION check_event_slot_availability(
  p_date date,
  p_time time,
  p_duration interval
)
RETURNS boolean AS $$
BEGIN
  -- Check if date is not blacked out
  IF EXISTS (
    SELECT 1 FROM blackout_dates
    WHERE date = p_date AND affects_events = true
  ) THEN
    RETURN false;
  END IF;

  -- Check if there are no overlapping events
  RETURN NOT EXISTS (
    SELECT 1
    FROM event_bookings
    WHERE event_date = p_date
    AND status NOT IN ('cancelled')
    AND (
      event_time BETWEEN p_time AND p_time + p_duration
      OR p_time BETWEEN event_time AND event_time + (duration_hours * interval '1 hour')
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Insert sample tables if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tables LIMIT 1) THEN
    INSERT INTO tables (name, capacity, section) VALUES
    ('T1', 2, 'Main'),
    ('T2', 2, 'Main'),
    ('T3', 4, 'Main'),
    ('T4', 4, 'Main'),
    ('T5', 6, 'Main'),
    ('T6', 6, 'Main'),
    ('B1', 2, 'Bar'),
    ('B2', 2, 'Bar'),
    ('B3', 2, 'Bar'),
    ('B4', 2, 'Bar'),
    ('L1', 4, 'Lounge'),
    ('L2', 4, 'Lounge'),
    ('L3', 6, 'Lounge'),
    ('L4', 6, 'Lounge');
  END IF;
END $$;

-- Insert sample time slots if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM time_slots LIMIT 1) THEN
    INSERT INTO time_slots (start_time, end_time, day_of_week, capacity, is_event_slot) VALUES
    ('17:00', '19:00', 1, 30, false),
    ('17:00', '19:00', 2, 30, false),
    ('17:00', '19:00', 3, 30, false),
    ('17:00', '19:00', 4, 30, false),
    ('17:00', '19:00', 5, 30, false),
    ('19:30', '21:30', 1, 30, false),
    ('19:30', '21:30', 2, 30, false),
    ('19:30', '21:30', 3, 30, false),
    ('19:30', '21:30', 4, 30, false),
    ('19:30', '21:30', 5, 30, false),
    ('17:00', '19:00', 6, 40, false),
    ('19:30', '21:30', 6, 40, false),
    ('17:00', '19:00', 0, 40, false),
    ('19:30', '21:30', 0, 40, false),
    ('11:00', '13:00', 6, 8, true),
    ('15:00', '17:00', 6, 8, true);
  END IF;
END $$;
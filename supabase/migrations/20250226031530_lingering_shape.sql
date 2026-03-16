-- Drop existing time slots
DELETE FROM time_slots;

-- Insert new time slots with 15-minute increments
INSERT INTO time_slots (start_time, end_time, day_of_week, capacity, is_event_slot) VALUES
-- Monday through Friday (1-5)
('17:00', '17:15', 1, 30, false),
('17:15', '17:30', 1, 30, false),
('17:30', '17:45', 1, 30, false),
('17:45', '18:00', 1, 30, false),
('18:00', '18:15', 1, 30, false),
('18:15', '18:30', 1, 30, false),
('18:30', '18:45', 1, 30, false),
('18:45', '19:00', 1, 30, false),
('19:00', '19:15', 1, 30, false),
('19:15', '19:30', 1, 30, false),
('19:30', '19:45', 1, 30, false),
('19:45', '20:00', 1, 30, false),
('20:00', '20:15', 1, 30, false),
('20:15', '20:30', 1, 30, false),
('20:30', '20:45', 1, 30, false),
('20:45', '21:00', 1, 30, false),
('21:00', '21:15', 1, 30, false),
('21:15', '21:30', 1, 30, false),

-- Repeat for Tuesday (2)
('17:00', '17:15', 2, 30, false),
('17:15', '17:30', 2, 30, false),
('17:30', '17:45', 2, 30, false),
('17:45', '18:00', 2, 30, false),
('18:00', '18:15', 2, 30, false),
('18:15', '18:30', 2, 30, false),
('18:30', '18:45', 2, 30, false),
('18:45', '19:00', 2, 30, false),
('19:00', '19:15', 2, 30, false),
('19:15', '19:30', 2, 30, false),
('19:30', '19:45', 2, 30, false),
('19:45', '20:00', 2, 30, false),
('20:00', '20:15', 2, 30, false),
('20:15', '20:30', 2, 30, false),
('20:30', '20:45', 2, 30, false),
('20:45', '21:00', 2, 30, false),
('21:00', '21:15', 2, 30, false),
('21:15', '21:30', 2, 30, false),

-- Repeat for Wednesday (3)
('17:00', '17:15', 3, 30, false),
('17:15', '17:30', 3, 30, false),
('17:30', '17:45', 3, 30, false),
('17:45', '18:00', 3, 30, false),
('18:00', '18:15', 3, 30, false),
('18:15', '18:30', 3, 30, false),
('18:30', '18:45', 3, 30, false),
('18:45', '19:00', 3, 30, false),
('19:00', '19:15', 3, 30, false),
('19:15', '19:30', 3, 30, false),
('19:30', '19:45', 3, 30, false),
('19:45', '20:00', 3, 30, false),
('20:00', '20:15', 3, 30, false),
('20:15', '20:30', 3, 30, false),
('20:30', '20:45', 3, 30, false),
('20:45', '21:00', 3, 30, false),
('21:00', '21:15', 3, 30, false),
('21:15', '21:30', 3, 30, false),

-- Repeat for Thursday (4)
('17:00', '17:15', 4, 30, false),
('17:15', '17:30', 4, 30, false),
('17:30', '17:45', 4, 30, false),
('17:45', '18:00', 4, 30, false),
('18:00', '18:15', 4, 30, false),
('18:15', '18:30', 4, 30, false),
('18:30', '18:45', 4, 30, false),
('18:45', '19:00', 4, 30, false),
('19:00', '19:15', 4, 30, false),
('19:15', '19:30', 4, 30, false),
('19:30', '19:45', 4, 30, false),
('19:45', '20:00', 4, 30, false),
('20:00', '20:15', 4, 30, false),
('20:15', '20:30', 4, 30, false),
('20:30', '20:45', 4, 30, false),
('20:45', '21:00', 4, 30, false),
('21:00', '21:15', 4, 30, false),
('21:15', '21:30', 4, 30, false),

-- Repeat for Friday (5)
('17:00', '17:15', 5, 30, false),
('17:15', '17:30', 5, 30, false),
('17:30', '17:45', 5, 30, false),
('17:45', '18:00', 5, 30, false),
('18:00', '18:15', 5, 30, false),
('18:15', '18:30', 5, 30, false),
('18:30', '18:45', 5, 30, false),
('18:45', '19:00', 5, 30, false),
('19:00', '19:15', 5, 30, false),
('19:15', '19:30', 5, 30, false),
('19:30', '19:45', 5, 30, false),
('19:45', '20:00', 5, 30, false),
('20:00', '20:15', 5, 30, false),
('20:15', '20:30', 5, 30, false),
('20:30', '20:45', 5, 30, false),
('20:45', '21:00', 5, 30, false),
('21:00', '21:15', 5, 30, false),
('21:15', '21:30', 5, 30, false),

-- Saturday (6) - Higher capacity
('17:00', '17:15', 6, 40, false),
('17:15', '17:30', 6, 40, false),
('17:30', '17:45', 6, 40, false),
('17:45', '18:00', 6, 40, false),
('18:00', '18:15', 6, 40, false),
('18:15', '18:30', 6, 40, false),
('18:30', '18:45', 6, 40, false),
('18:45', '19:00', 6, 40, false),
('19:00', '19:15', 6, 40, false),
('19:15', '19:30', 6, 40, false),
('19:30', '19:45', 6, 40, false),
('19:45', '20:00', 6, 40, false),
('20:00', '20:15', 6, 40, false),
('20:15', '20:30', 6, 40, false),
('20:30', '20:45', 6, 40, false),
('20:45', '21:00', 6, 40, false),
('21:00', '21:15', 6, 40, false),
('21:15', '21:30', 6, 40, false),

-- Sunday (0) - Higher capacity
('17:00', '17:15', 0, 40, false),
('17:15', '17:30', 0, 40, false),
('17:30', '17:45', 0, 40, false),
('17:45', '18:00', 0, 40, false),
('18:00', '18:15', 0, 40, false),
('18:15', '18:30', 0, 40, false),
('18:30', '18:45', 0, 40, false),
('18:45', '19:00', 0, 40, false),
('19:00', '19:15', 0, 40, false),
('19:15', '19:30', 0, 40, false),
('19:30', '19:45', 0, 40, false),
('19:45', '20:00', 0, 40, false),
('20:00', '20:15', 0, 40, false),
('20:15', '20:30', 0, 40, false),
('20:30', '20:45', 0, 40, false),
('20:45', '21:00', 0, 40, false),
('21:00', '21:15', 0, 40, false),
('21:15', '21:30', 0, 40, false),

-- Event slots for Saturday
('11:00', '11:15', 6, 8, true),
('11:15', '11:30', 6, 8, true),
('11:30', '11:45', 6, 8, true),
('11:45', '12:00', 6, 8, true),
('12:00', '12:15', 6, 8, true),
('12:15', '12:30', 6, 8, true),
('12:30', '12:45', 6, 8, true),
('12:45', '13:00', 6, 8, true),
('15:00', '15:15', 6, 8, true),
('15:15', '15:30', 6, 8, true),
('15:30', '15:45', 6, 8, true),
('15:45', '16:00', 6, 8, true),
('16:00', '16:15', 6, 8, true),
('16:15', '16:30', 6, 8, true),
('16:30', '16:45', 6, 8, true),
('16:45', '17:00', 6, 8, true);

-- Create function to check time slot availability
CREATE OR REPLACE FUNCTION check_time_slot_availability(
  p_date date,
  p_time time,
  p_party_size integer
)
RETURNS boolean AS $$
DECLARE
  v_capacity integer;
  v_booked integer;
BEGIN
  -- Get the capacity for this time slot
  SELECT capacity INTO v_capacity
  FROM time_slots
  WHERE start_time = p_time
  AND day_of_week = EXTRACT(DOW FROM p_date)
  AND active = true
  AND NOT is_event_slot;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get total booked seats for this time slot
  SELECT COALESCE(SUM(party_size), 0) INTO v_booked
  FROM reservations
  WHERE reservation_date = p_date
  AND reservation_time = p_time
  AND status NOT IN ('cancelled', 'no_show');

  -- Check if there's enough capacity
  RETURN (v_capacity - v_booked) >= p_party_size;
END;
$$ LANGUAGE plpgsql;
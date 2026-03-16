-- Create enum for investor status
CREATE TYPE investor_status AS ENUM ('new', 'contacted', 'meeting_scheduled', 'declined', 'approved');

-- Create investor submissions table
CREATE TABLE investor_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  accredited_status text NOT NULL,
  investment_amount text NOT NULL,
  prior_experience text NOT NULL,
  interest_reason text NOT NULL,
  willing_to_sign_nda boolean DEFAULT false,
  preferred_contact text NOT NULL,
  status investor_status DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE investor_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit investor interest forms"
  ON investor_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view and manage submissions"
  ON investor_submissions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_investor_submissions_updated_at
  BEFORE UPDATE ON investor_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
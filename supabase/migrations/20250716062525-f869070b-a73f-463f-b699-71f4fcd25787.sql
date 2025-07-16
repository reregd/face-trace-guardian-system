-- Create detection status enum
CREATE TYPE detection_status AS ENUM ('known', 'unknown', 'pending');

-- Create faces table for known faces database
CREATE TABLE public.faces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  embeddings FLOAT8[] NOT NULL,
  image_path VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_logs table for detection logging
CREATE TABLE public.event_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location JSONB,
  camera VARCHAR(100),
  face_id INTEGER REFERENCES public.faces(id),
  match_status detection_status NOT NULL,
  image_path VARCHAR(500),
  confidence FLOAT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE public.faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for faces table
CREATE POLICY "Allow public access to faces" ON public.faces FOR ALL USING (true);

-- Create policies for event_logs table  
CREATE POLICY "Allow public access to event_logs" ON public.event_logs FOR ALL USING (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('faces_known', 'faces_known', true),
  ('faces_unknown', 'faces_unknown', true),
  ('documents', 'documents', true),
  ('videos', 'videos', true);

-- Create storage policies for faces_known bucket
CREATE POLICY "Public read access for faces_known" ON storage.objects
  FOR SELECT USING (bucket_id = 'faces_known');

CREATE POLICY "Public insert access for faces_known" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'faces_known');

CREATE POLICY "Public update access for faces_known" ON storage.objects
  FOR UPDATE USING (bucket_id = 'faces_known');

CREATE POLICY "Public delete access for faces_known" ON storage.objects
  FOR DELETE USING (bucket_id = 'faces_known');

-- Create storage policies for faces_unknown bucket
CREATE POLICY "Public read access for faces_unknown" ON storage.objects
  FOR SELECT USING (bucket_id = 'faces_unknown');

CREATE POLICY "Public insert access for faces_unknown" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'faces_unknown');

CREATE POLICY "Public update access for faces_unknown" ON storage.objects
  FOR UPDATE USING (bucket_id = 'faces_unknown');

CREATE POLICY "Public delete access for faces_unknown" ON storage.objects
  FOR DELETE USING (bucket_id = 'faces_unknown');

-- Create storage policies for documents bucket
CREATE POLICY "Public read access for documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Public insert access for documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Public update access for documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents');

CREATE POLICY "Public delete access for documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents');

-- Create storage policies for videos bucket
CREATE POLICY "Public read access for videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Public insert access for videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Public update access for videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos');

CREATE POLICY "Public delete access for videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos');

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for faces table
CREATE TRIGGER update_faces_updated_at
  BEFORE UPDATE ON public.faces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    switch (path) {
      case 'detect':
        return await handleDetect(req);
      case 'compare':
        return await handleCompare(req);
      case 'faces':
        return await handleFaces(req);
      case 'upload':
        return await handleUpload(req);
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }), 
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleDetect(req: Request) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const { imageData } = await req.json();
  
  // Here you would implement face detection logic
  // For now, return a mock response
  return new Response(
    JSON.stringify({
      success: true,
      faces: [
        {
          id: `face-${Date.now()}`,
          confidence: 0.95,
          box: { x: 100, y: 100, width: 150, height: 150 },
          landmarks: [],
          embedding: new Array(512).fill(0).map(() => Math.random())
        }
      ]
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleCompare(req: Request) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const { embedding, threshold = 0.35 } = await req.json();
  
  const { data, error } = await supabase.rpc('search_similar_faces', {
    input_embedding: `[${embedding.join(',')}]`,
    similarity_threshold: threshold,
    max_results: 5
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({ matches: data || [] }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleFaces(req: Request) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('face_embeddings')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ faces: data || [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  if (req.method === 'POST') {
    const { image_url, embedding, name, metadata } = await req.json();
    
    const { data, error } = await supabase
      .from('face_embeddings')
      .insert({
        image_url,
        embedding: `[${embedding.join(',')}]`,
        name,
        metadata
      })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ face: data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleUpload(req: Request) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const bucket = formData.get('bucket') as string || 'religion';

  if (!file) {
    return new Response(
      JSON.stringify({ error: 'No file provided' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      path: data.path,
      url: `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${bucket}/${data.path}`
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
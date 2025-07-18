import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FaceEmbedding {
  name: string;
  embeddings: number[];
  image_path: string;
  metadata: any;
}

// Simplified face embedding extraction (you would use a proper ML model)
function generateSimpleEmbedding(imageName: string): number[] {
  // Create a deterministic embedding based on filename for demo
  const hash = imageName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return Array.from({ length: 128 }, (_, i) => 
    Math.sin(hash + i) * 0.5 + 0.5
  );
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting bucket scan for faces...');

    // List all files in religion bucket
    const { data: files, error: listError } = await supabase.storage
      .from('religion')
      .list('', { 
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return new Response(JSON.stringify({ error: listError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${files?.length || 0} files to process`);

    const processedFaces: FaceEmbedding[] = [];
    let processed = 0;

    // Process each image file
    for (const file of files || []) {
      if (!file.name.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

      try {
        // Extract folder name as person name
        const pathParts = file.name.split('/');
        const folderName = pathParts.length > 1 ? pathParts[0] : 'Unknown';
        
        // Generate embedding (simplified for demo)
        const embeddings = generateSimpleEmbedding(file.name);
        
        const faceData: FaceEmbedding = {
          name: folderName,
          embeddings,
          image_path: `religion/${file.name}`,
          metadata: {
            original_filename: file.name,
            folder: folderName,
            processed_at: new Date().toISOString(),
            size: file.metadata?.size || 0
          }
        };

        // Check if this face already exists
        const { data: existingFace } = await supabase
          .from('faces')
          .select('id')
          .eq('image_path', faceData.image_path)
          .single();

        if (!existingFace) {
          // Insert new face
          const { error: insertError } = await supabase
            .from('faces')
            .insert(faceData);

          if (insertError) {
            console.error(`Error inserting face for ${file.name}:`, insertError);
          } else {
            processedFaces.push(faceData);
            processed++;
          }
        }

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }

    console.log(`Scan complete. Processed ${processed} new faces.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully processed ${processed} faces`,
      total_files: files?.length || 0,
      processed_faces: processed,
      faces: processedFaces.slice(0, 10) // Return first 10 for preview
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scan error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
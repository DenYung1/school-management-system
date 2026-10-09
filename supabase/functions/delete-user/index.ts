import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const projectUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!projectUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Supabase function secrets are not configured');
    }

    const userClient = createClient(projectUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const serviceClient = createClient(projectUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const { data: requesterProfile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || requesterProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Administrator access required' }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    const { userId } = await request.json();
    if (!userId || userId === user.id) {
      return new Response(JSON.stringify({ error: 'A different user id is required' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error('delete-user error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unable to delete user' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
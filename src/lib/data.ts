// src/lib/data.ts
import { supabase } from './supabase';

// Obtener todos los centros aprobados
export async function fetchCenters() {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  return { data, error };
}

// Obtener centros por categoría (búsqueda simple con LIKE)
export async function fetchCentersByCategory(category: string) {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .eq('status', 'approved')
    .ilike('category', `%${category}%`)
    .order('created_at', { ascending: false });
  return { data, error };
}

// Buscar centros por nombre o dirección
export async function searchCenters(query: string) {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .eq('status', 'approved')
    .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  return { data, error };
}

// Obtener centro por ID
export async function fetchCenterById(id: string) {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

// Obtener servicios de un centro
export async function fetchServicesByCenter(centerId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('center_id', centerId)
    .order('created_at', { ascending: true });
  return { data, error };
}

// Obtener reseñas de un centro
export async function fetchReviewsByCenter(centerId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, client:client_id ( full_name )')
    .eq('center_id', centerId)
    .order('created_at', { ascending: false });
  return { data, error };
}

// Obtener categorías únicas desde los centros aprobados
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('centers')
    .select('category')
    .eq('status', 'approved')
    .not('category', 'is', null);
  if (error) return { data: [], error };
  // Extraer valores únicos
  const categories = [...new Set(data.map((c: any) => c.category).filter(Boolean))];
  return { data: categories, error: null };
}
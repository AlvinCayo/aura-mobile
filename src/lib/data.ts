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

// Obtener horarios ocupados de un centro para una fecha dada
export async function fetchBookedSlots(centerId: string, date: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('center_id', centerId)
    .eq('appointment_date', date)
    .in('status', ['pending', 'confirmed']);
  return { data, error };
}

// Crear una cita (solicitud)
export async function createAppointment(appointment: {
  center_id: string;
  service_id?: string;
  client_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}) {
  const { data, error } = await supabase.from('appointments').insert({
    ...appointment,
    status: 'pending',
  }).select().single();
  return { data, error };
}

// Obtener citas del cliente actual
export async function fetchMyAppointments(clientId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, center:center_id(name), service:service_id(name, price)')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: false });
  return { data, error };
}

// Obtener citas por centro (para el panel del centro)
export async function fetchCenterAppointments(centerId: string, statusFilter?: string) {
  let query = supabase
    .from('appointments')
    .select('*, client:client_id(full_name, email), service:service_id(name)')
    .eq('center_id', centerId);
  if (statusFilter) query = query.eq('status', statusFilter);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  return { data, error };
}

// Actualizar estado de cita
export async function updateAppointmentStatus(id: string, status: string) {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id);
  return { error };
}

// Crear pago
export async function createPayment(appointmentId: string, amount: number, commission: number) {
  const { data, error } = await supabase.from('payments').insert({
    appointment_id: appointmentId,
    amount,
    commission,
  }).select().single();
  return { data, error };
}
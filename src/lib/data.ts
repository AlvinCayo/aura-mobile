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

// Obtener la configuración global de la plataforma (QR y comisión)
export async function fetchPlatformConfig() {
  const { data, error } = await supabase
    .from('platform_config')
    .select('*')
    .in('key', ['platform_qr_url', 'commission_percentage']);
  
  if (error) return { data: null, error };
  
  const config = data.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
  
  return { data: config, error: null };
}

// Subir comprobante al Storage
export async function uploadReceipt(uri: string, appointmentId: string) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = uri.split('.').pop();
    const filePath = `receipts/${appointmentId}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts') // Asegúrate de crear este bucket público en Supabase
      .upload(filePath, blob);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error };
  }
}

// Enviar pago para validación automática
// Enviar pago para validación automática
export async function submitPayment(appointmentId: string, paymentCode: string, receiptUrl: string, commissionAmount: number) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ 
      status: 'paid', // <--- ESTO ES VITAL: Poner 'paid' aquí
      payment_code: paymentCode,
      receipt_url: receiptUrl,
      commission_amount: commissionAmount
    })
    .eq('id', appointmentId)
    .select()
    .single();

  return { data, error };
}

// Subir el QR de la plataforma (SuperAdmin)
export async function uploadPlatformQR(uri: string) {
  try {
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `platform_qr_${Date.now()}.${fileExt}`;

    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: fileName,
      type: `image/${fileExt}`
    } as any);

    // CAMBIO CLAVE: Usamos el bucket 'service-images' que sabemos que existe y funciona
    const { error: uploadError } = await supabase.storage
      .from('service-images') 
      .upload(fileName, formData);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('service-images').getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error subiendo QR de plataforma:', error);
    return { url: null, error };
  }
}

// Guardar o actualizar una configuración en la BD
export async function updatePlatformConfig(key: string, value: string) {
  const { data, error } = await supabase
    .from('platform_config')
    .upsert({ key: key, value: value }, { onConflict: 'key' }) // Indicamos explícitamente la llave de conflicto
    .select()
    .single();

  if (error) console.error("Detalle del error en Supabase:", error);

  return { data, error };
}
import { supabase } from '../lib/supabase';
import type { Task } from '../types';

export async function getTasks(userId: string): Promise<Task[]> {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true, nullsFirst: false });
  return (data ?? []) as Task[];
}

export async function createTask(
  userId: string,
  fields: { title: string; description?: string; due_date?: string; category?: string; priority?: string },
): Promise<{ data: Task | null; error: string | null }> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, ...fields, status: 'open' })
    .select()
    .single();
  return { data: data as Task | null, error: error?.message ?? null };
}

export async function updateTaskStatus(
  taskId: string,
  status: Task['status'],
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
  return { error: error?.message ?? null };
}

export async function deleteTask(taskId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  return { error: error?.message ?? null };
}

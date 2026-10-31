export interface Task {
  id: number;
  subject: string;
  class_level: number;
  difficulty: string;
  task_type: string;
  scope: string;
  topic: string;
  points: number;
  time_minutes: number;
  source: string;
  twin_task_id: number | null;
  created_at: string;
  content_text: string;
  content_html: string;
}
export interface Answer {
  id: number;
  task_id: number;
  content_html: string;
  content_txt: string;
  is_valid: boolean;
}
// Adres API z frontend/.env (VITE_API_URL), bez końcowego slasha
const SERVER_IP = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '') + '/';

export const Path = {
  task: SERVER_IP + 'tasks/',
  answers: SERVER_IP + 'answers/',
  images: SERVER_IP + 'images/',
};
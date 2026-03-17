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
const SERVER_IP = 'http://127.0.0.1:8000/';

export const Path = {
  task: SERVER_IP + 'tasks/',
  answers: SERVER_IP + 'answers/',
  images: SERVER_IP + 'images/',
};
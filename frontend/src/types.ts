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
export type Task = {
  id: number;
  title: string;
  deadline: Date|null;
  description: string;
  progress: number;
  estimatedMinutes: number | null;
  starred: boolean;
  completed: boolean;
};

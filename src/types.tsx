export type Task = {
  id: number;
  title: string;
  deadline: Date|null;
  description: string;
  progress: number;
};
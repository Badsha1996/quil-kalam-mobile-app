export type Project = {
  id: number;
  type: "novel" | "poetry" | "shortStory" | "manuscript";
  title: string;
  description: string;
  genre: string;
  author_name: string;
  word_count: number;
  target_word_count: number;
  status: string;
  writing_template: string;
  created_at: number;
  updated_at: number;
};
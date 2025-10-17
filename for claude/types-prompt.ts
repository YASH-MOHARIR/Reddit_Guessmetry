export type Prompt = {
  id: number;
  promptText: string;
  answer: string;
  alternativeAnswers: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'everyday' | 'animals' | 'reddit' | 'abstract';
  createdBy?: string;
  timestamp?: number;
};

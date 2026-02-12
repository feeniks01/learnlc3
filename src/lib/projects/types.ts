export interface TestCase {
  description: string;
  input?: string;
  expectedOutput?: string;
  preloadMemory?: { address: number; value: number }[];
  checkMemory?: { address: number; value: number }[];
  checkRegisters?: { register: number; value: number }[];
}

export interface Project {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  details: string;
  hints: string[];
  starter: string;
  tests: TestCase[];
}

import readline from 'readline';

export const prompt = (question: string): Promise<string | null> => {
  const line = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    line.question(question, (answer) => {
      const trimmed = answer.trim();
      line.close();

      if (trimmed.length === 0) {
        return resolve(null);
      }

      return resolve(trimmed);
    });
  });
};

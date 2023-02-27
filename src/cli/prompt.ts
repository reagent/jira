import readline from 'readline';

export const prompt = (question: string): Promise<string | undefined> => {
  const line = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    line.question(question, (answer) => {
      const trimmed = answer.trim();
      line.close();

      if (trimmed.length === 0) {
        return resolve(undefined);
      }

      return resolve(trimmed);
    });
  });
};

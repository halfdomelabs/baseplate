export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  multiply(a: number, b: number): number {
<<<<<<< existing
    // Enhanced multiplication with logging
    console.log(`Multiplying ${a} and ${b}`);
=======
    // Optimized multiplication
    if (b === 0) return 0;
    if (b === 1) return a;
>>>>>>> baseplate
    return a * b;
  }
}

export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  multiply(a: number, b: number): number {
    // Enhanced multiplication with logging
    console.log(`Multiplying ${a} and ${b}`);
    return a * b;
  }
}

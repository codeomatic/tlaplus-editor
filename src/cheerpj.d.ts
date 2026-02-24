// Global Type Definitions for CheerpJ 3.0+
// See: https://labs.leaningtech.com/cheerpj3

/**
 * Initializes the CheerpJ runtime environments.
 * Must be called before any other CheerpJ API.
 */
declare function cheerpjInit(options?: any): Promise<void>;

/**
 * Runs the main method of a Java class.
 * @param className The fully qualified name of the class to run (e.g., "tlc2.TLC")
 * @param args The arguments to pass to the main method
 * @returns A promise that resolves to the exit code of the Java program
 */
declare function cheerpjRunMain(className: string, ...args: string[]): Promise<number>;

/**
 * Creates a virtual file in the CheerpJ /str/ filesystem containing a clear text string.
 * @param path The absolute path in the /str/ filesystem (e.g., "/str/MyFile.txt")
 * @param content The string content of the file
 */
declare function cheerpOSAddStringFile(path: string, content: string): void;

// Simplify console.log output by removing Jest's stack trace printing
const originalLog = console.log;

console.log = (...args: any[]) => {
    // Print log messages directly, one per line
    process.stdout.write(args.join(" ") + "\n");
};

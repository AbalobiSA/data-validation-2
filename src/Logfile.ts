export class Logfile {

    finishTime: Date;
    runtime: string;
    email_subject: string;

    private testsRun: number;
    private testsFailed: number;
    private totalErrors: number;

    private LOG: string[];
    private STATUS: string;

    constructor() {
        this.testsRun = 0;
        this.testsFailed = 0;
        this.totalErrors = 0;
        this.LOG = [];
    }

    addLog(log: string): void {
        this.LOG.push(log);
        console.log(log);
    }

    getLog(): string {
        return this.LOG.join("");
    }

    incrementErrors(errorNum: number): void {
        this.totalErrors += errorNum;
    }

    incrementTestsRun(): void {
        this.testsRun += 1;
    }

    incrementTestsFailed(): void {
        this.testsFailed += 1;
    }

    setStatus(status: string): void {
        this.STATUS = status;
    }

    getStatus(): string {
        return this.STATUS;
    }

    getErrors(): number {
        return this.totalErrors;
    }

    getTestsRun(): number {
        return this.testsRun;
    }

    getFails(): number {
        return this.testsFailed;
    }

}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logfile {
    constructor() {
        this.testsRun = 0;
        this.testsFailed = 0;
        this.totalErrors = 0;
        this.LOG = [];
    }
    addLog(log) {
        this.LOG.push(log);
        console.log(log);
    }
    getLog() {
        return this.LOG.join("");
    }
    incrementErrors(errorNum) {
        this.totalErrors += errorNum;
    }
    incrementTestsRun() {
        this.testsRun += 1;
    }
    incrementTestsFailed() {
        this.testsFailed += 1;
    }
    setStatus(status) {
        this.STATUS = status;
    }
    getStatus() {
        return this.STATUS;
    }
    getErrors() {
        return this.totalErrors;
    }
    getTestsRun() {
        return this.testsRun;
    }
    getFails() {
        return this.testsFailed;
    }
}
exports.Logfile = Logfile;

//# sourceMappingURL=Logfile.js.map

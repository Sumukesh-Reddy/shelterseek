const path = require('path');
const controllerPath = path.resolve(__dirname, '../src/controllers/roomController.js');
const testPath = path.resolve(__dirname, '../tests/room.test.js');

console.log('Controller Path:', controllerPath);
console.log('Test Path:', testPath);

const roomInController = path.resolve(path.dirname(controllerPath), '../models/Room');
const roomInTest = path.resolve(path.dirname(testPath), '../src/models/Room');

console.log('Room in Controller resolved to:', roomInController);
console.log('Room in Test resolved to:', roomInTest);

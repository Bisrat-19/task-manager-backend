Task Manager API
A simple REST API for managing tasks, built with Node.js and Express. Tasks are stored in a local JSON file (tasks.json).
Setup

Clone the repository.
Install dependencies:npm install express cors


Run the server:node server.js


The API will be available at http://localhost:3000.

Endpoints

GET /api/tasks: Retrieve all tasks.
POST /api/tasks: Create a new task (send JSON with title field).
PUT /api/tasks/:id: Mark a task as completed.
DELETE /api/tasks/:id: Delete a task.

Example Usage

Get all tasks:curl http://localhost:3000/api/tasks


Add a task:curl -X POST -H "Content-Type: application/json" -d '{"title":"New task"}' http://localhost:3000/api/tasks


Mark task as completed:curl -X PUT http://localhost:3000/api/tasks/1


Delete a task:curl -X DELETE http://localhost:3000/api/tasks/1



Notes

Tasks are stored in tasks.json.
Basic validation ensures task titles are not empty.
A simple HTML page is served at the root (/) to confirm the API is running.

